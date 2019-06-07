exports = module.exports = function() {
  return {
    offline: {
      use: false,
      folder: "<folder>"
    },
    database: "<test>",
    checkTime: 0.1, // seconds
    cacheTime: 30, // seconds
    saveTime: 2, // seconds
    deleteTime: 2, // seconds
    cdn: {
      email: "<email>",
      apiKey: "<apiKey>",
      domain: "<domain/space>",
      folder: "<folder>"
    }
  };
};