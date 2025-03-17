require("dotenv").config();

const { exec } = require("child_process");

const processes = [];

function runMicroservice(path, name) {
  const childProcess = exec(`node ${path}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error in ${name}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`${name} stderr: ${stderr}`);
      return;
    }
    console.log(`${name} stdout: ${stdout}`);
  });

  //log
  childProcess.stdout.on("data", (data) => {
    console.log(`[${name}] ${data}`);
  });

  childProcess.stderr.on("data", (data) => {
    console.error(`[${name} ERROR] ${data}`);
  });
  processes.push(childProcess);
  return childProcess;
}

//all consumers and processes go here.
const publisher1 = runMicroservice(
  "./publishers/publisher1/app/publisher1.js",
  "Publisher1"
);
const consumer1 = runMicroservice(
  "./consumers/consumer1/app/consumer1.js",
  "Consumer1"
);

setInterval(() => {
  //nothing
}, 1000);

//Ctrl+C
process.on("SIGINT", () => {
  processes.forEach((process) => process.kill());
  console.log("Processes terminated.");
  process.exit();
});
