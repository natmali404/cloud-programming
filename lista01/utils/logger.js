const { format } = require("date-fns");

const logger = {
  info: (message) =>
    console.log(
      `[INFO] ${format(
        new Date().toISOString(),
        "yyyy-MM-dd HH:mm:ss.SS"
      )} - ${message}`
    ),

  error: (message) =>
    console.log(
      `[ERROR] ${format(
        new Date().toISOString(),
        "yyyy-MM-dd HH:mm:ss.SS"
      )} - ${message}`
    ),
};

module.exports = logger;
