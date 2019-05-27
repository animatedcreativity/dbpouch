exports = module.exports = function() {
  return {
    offline: {
      use: true,
      folder: "<folder>"
    },
    database: "<test>",
    checkTime: 0.1, // seconds
    cacheTime: 30, // seconds
    cdn: {
      email: "<email>",
      apiKey: "<apiKey>",
      domain: "<domain/space>",
      folder: "<folder>"
    }
  };
};