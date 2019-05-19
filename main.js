exports = module.exports = function(config) {
  var sanitize = require("node-sanitize-options");
  config = sanitize.options(config, require("./config.js")());
  var request = require("request");
  var app = {
    status: require("./status.js")(),
    endpoint: function(type) {
      app[type] = function(query, database) {
        return new Promise(function(resolve, reject) {
          if (typeof database === "undefined") database = config.database;
          if (typeof database === "undefined" || database.trim() === "") {
            reject({status: app.status.databaseError, error: "Database error."});
            return false;
          }
          if (typeof query === "undefined") {
            reject({status: app.status.queryError, error: "Query error."});
            return false;
          }
          if (typeof query === "object") query = JSON.stringify(query);
          request.post({url: config.link + "/db/" + type, formData: {apiKey: config.apiKey, database: database, query: query}}, function(error, response, body) {
            try {
              var data = JSON.parse(body);
              if (typeof data.reason === "undefined" && typeof data.error === "undefined") {
                resolve(data);
              } else {
                reject(data);
              }
            } catch (error) {
              reject({status: app.status.loadError, error: body});
            }
          });
        });
      };
    },
    start: function() {
      app.endpoint("get");
      app.endpoint("save");
      app.endpoint("record");
      app.endpoint("records");
    }
  };
  app.start();
  return app;
};