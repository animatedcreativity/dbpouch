exports = module.exports = function(config) {
  var sanitize = require("node-sanitize-options");
  config = sanitize.options(config, require("./config.js")());
  var cdnfly = require("cdnfly")();
  var request = require("request");
  var random = require("randomstring");
  var fs = require("fs");
  var app = {
    status: require("./status.js")(),
    wrapper: require("node-promise-wrapper"),
    timeouts: {},
    db: {
      loading: {},
      id: function() {
        return "id-" + random.generate(32);
      },
      list: {},
      match: function(values, data) {
        var matched = true;
        for (var key in values) {
          if (values[key] != data[key]) matched = false;
        }
        return matched;
      },
      load: function(database) {
        return new Promise(async function(resolve, reject) {
          app.db.clear();
          if (app.db.loading[database] !== true) {
            if (typeof app.db.list[database] === "undefined") {
              var offlineFile = config.offline.folder + "/" + database + ".json";
              if (config.offline.use === true && fs.existsSync(offlineFile) === true) {
                var json = JSON.parse(fs.readFileSync(offlineFile, "utf8"));
              } else {
                app.db.loading[database] = true;
                var file = config.cdn.folder + "/" + database + ".json";
                var {error, json} = await app.wrapper("json", cdnfly.readFile(config.cdn, file));
                if (!(typeof json === "object" && json.status != 403)) json = {};
                if (config.offline.use === true) fs.writeFileSync(offlineFile, JSON.stringify(json), "utf8");
              }
              if (typeof json.data === "undefined") json.data = {};
              json.loadTime = Date.now();
              app.db.list[database] = json;
              app.db.loading[database] = false;
            }
            resolve(app.db.list[database]);
          } else {
            var interval = setInterval(function() {
              if (app.db.loading[database] !== true) {
                clearInterval(interval);
                resolve(app.db.list[database]);
              }
            }, config.checkTime * 1000);
          }
        });
      },
      clear: function() {
        for (var database in app.db.list) {
          var db = app.db.list[database];
          if (db !== "undefined" && app.db.loading[database] !== true && db.changed !== true && Date.now() - db.loadTime > config.cacheTime * 1000) {
            delete app.db.list[database];
          }
        }
      }
    },
    get: function(id, database) {
      return new Promise(async function(resolve, reject) {
        if (typeof database === "undefined") database = config.database;
        if (typeof database === "undefined" || database.trim() === "") {
          reject({status: app.status.databaseError, error: "Database error."});
          return false;
        }
        var {db} = await app.wrapper("db", app.db.load(database));
        var data = db.data[id];
        if (typeof data !== "undefined") {
          resolve(data);
        } else {
          reject({status: app.status.notFound, error: "missing"});
        }
      });
    },
    save: function(object, database) {
      return new Promise(async function(resolve, reject) {
        if (typeof object !== "object" || object === null) {
          reject({status: app.status.objectError, error: "Object error."});
          return false;
        }
        if (typeof database === "undefined") database = config.database;
        if (typeof database === "undefined" || database.trim() === "") {
          reject({status: app.status.databaseError, error: "Database error."});
          return false;
        }
        if (typeof object._id === "undefined") object._id = app.db.id();
        if (typeof object._rev === "undefined") object._rev = app.db.id(); // just to support pouchdb
        var {db} = await app.wrapper("db", app.db.load(database));
        var saved = {};
        if (typeof db.data[object._id] !== "undefined") saved = db.data[object._id];
        for (var key in object) {
          saved[key] = object[key];
        }
        db.data[object._id] = saved;
        if (config.offline.use === true) {
          var file = config.offline.folder + "/" + database + ".json";
          fs.writeFileSync(file, JSON.stringify(db), "utf8");
          resolve({status: app.status.success, message: "Done.", _id: saved._id, id: saved._id});
        } else {
          var updateJson = {};
          updateJson[saved._id] = saved;
          var file = config.cdn.folder + "/" + database + ".json";
          var {error, result} = await app.wrapper("result", cdnfly.json.put(config.cdn, file, updateJson));
          if (typeof result !== "undefined") {
            resolve({status: app.status.success, message: "Done.", _id: saved._id, id: saved._id});
          } else {
            reject(error);
          }
        }
      });
    },
    delete: function(id, database) {
      return new Promise(async function(resolve, reject) {
        if (typeof id === "undefined") id = "";
        if (typeof database === "undefined") database = config.database;
        if (typeof database === "undefined" || database.trim() === "") {
          reject({status: app.status.databaseError, error: "Database error."});
          return false;
        }
        var {db} = await app.wrapper("db", app.db.load(database));
        if (typeof db.data[id] !== "undefined") delete db.data[id];
        if (config.offline.use === true) {
          var file = config.offline.folder + "/" + database + ".json";
          fs.writeFileSync(file, JSON.stringify(db), "utf8");
          resolve({status: app.status.success, message: "Done."});
        } else {
          var updateJson = {};
          updateJson[id] = {};
          var file = config.cdn.folder + "/" + database + ".json";
          var {error, result} = await app.wrapper("result", cdnfly.json.delete(config.cdn, file, updateJson));
          if (typeof result !== "undefined") {
            resolve(result);
          } else {
            reject(error);
          }
        }
      });
    },
    record: function(query, database) {
      return new Promise(async function(resolve, reject) {
        if (typeof database === "undefined") database = config.database;
        if (typeof database === "undefined" || database.trim() === "") {
          reject({status: app.status.databaseError, error: "Database error."});
          return false;
        }
        if (typeof query === "string") query = {_id: query};
        if (typeof query.selector !== "undefined") query = query.selector;
        var {db} = await app.wrapper("db", app.db.load(database));
        var found;
        for (var key in db.data) {
          var data = db.data[key];
          if (app.db.match(query, data) === true) {
            found = data;
            break;
          }
        }
        if (typeof found !== "undefined") {
          resolve(found);
        } else {
          reject({status: app.status.notFound, error: "missing"});
        }
      });
    },
    records: function(query, database) {
      return new Promise(async function(resolve, reject) {
        if (typeof database === "undefined") database = config.database;
        if (typeof database === "undefined" || database.trim() === "") {
          reject({status: app.status.databaseError, error: "Database error."});
          return false;
        }
        if (typeof query === "string") query = {_id: query};
        if (typeof query.selector !== "undefined") query = query.selector;
        var {db} = await app.wrapper("db", app.db.load(database));
        var list = [];
        for (var key in db.data) {
          var data = db.data[key];
          if (app.db.match(query, data) === true) {
            list.push(data);
          }
        }
        resolve(list);
      });
    }
  };
  return app;
};