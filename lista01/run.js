require("dotenv").config();

const { exec } = require("child_process");

const processes = [];

function runMicroservice(path, name, suffix = "") {
  const fullName = `${name}_${suffix}`;
  const childProcess = exec(
    `node ${path} ${fullName}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error in ${fullName}: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`${fullName} stderr: ${stderr}`);
        return;
      }
      console.log(`${fullName} stdout: ${stdout}`);
    }
  );

  //log
  childProcess.stdout.on("data", (data) => {
    console.log(`[${fullName}] ${data}`);
  });

  childProcess.stderr.on("data", (data) => {
    console.error(`[${fullName} ERROR] ${data}`);
  });
  processes.push(childProcess);
  return childProcess;
}

const delay = (delayTime) => {
  return new Promise((resolve) => setTimeout(resolve, delayTime));
};

//all consumers and processes go here.
const startPublishers = async () => {
  console.log("Starting all publishers...");
  const publisher1_1 = runMicroservice(
    "./publishers/publisher1/app/publisher1.js",
    "Publisher1",
    1
  );
  await delay(500);
  const publisher1_2 = runMicroservice(
    "./publishers/publisher1/app/publisher1.js",
    "Publisher1",
    2
  );
  await delay(500);
  const publisher1_3 = runMicroservice(
    "./publishers/publisher1/app/publisher1.js",
    "Publisher1",
    3
  );
  console.log("All publishers operational.");
};

const startConsumers = async () => {
  console.log("Starting all consumers...");
  const consumer1_1 = runMicroservice(
    "./consumers/consumer1/app/consumer1.js",
    "Consumer1",
    1
  );
  await delay(500);
  const consumer1_2 = runMicroservice(
    "./consumers/consumer1/app/consumer1.js",
    "Consumer1",
    2
  );
  console.log("All consumers operational.");
};

//Ctrl+C
process.on("SIGINT", () => {
  processes.forEach((process) => process.kill());
  console.log("Processes terminated.");
  process.exit();
});

startPublishers();
startConsumers();

setInterval(() => {
  //nothing, keep-alive
}, 1000);
