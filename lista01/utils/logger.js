const logger = {
  info: (message) =>
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`),

  error: (message) =>
    console.log(`[ERROR] ${new Date().toISOString()} - ${message}`),
};

module.exports = logger;
