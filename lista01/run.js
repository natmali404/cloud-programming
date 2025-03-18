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

//all consumers and processes go here.
const startPublishers = async () => {
  console.log("Starting all publishers...");

  //3 publishers generating Type1 events in equal intervals
  runMicroservice("./publishers/publisher1/app/publisher1.js", "Publisher1", 1);
  runMicroservice("./publishers/publisher1/app/publisher1.js", "Publisher1", 2);
  runMicroservice("./publishers/publisher1/app/publisher1.js", "Publisher1", 3);
  //1 publisher generating Type2 event randomly (short interval)
  runMicroservice("./publishers/publisher2/app/publisher2.js", "Publisher2", 1);
  //1 publisher generating Type3 event randomly (long interval)
  runMicroservice("./publishers/publisher3/app/publisher3.js", "Publisher3", 1);

  //console.log("All publishers operational."); //this should be modified with promise resolving and await
};

const startConsumers = async () => {
  console.log("Starting all consumers...");

  //2 consumers for Type1 events
  runMicroservice("./consumers/consumer1/app/consumer1.js", "Consumer1", 1);
  runMicroservice("./consumers/consumer1/app/consumer1.js", "Consumer1", 2);
  //1 consumer for Type2 event
  runMicroservice("./consumers/consumer2/app/consumer2.js", "Consumer2", 2);
  //1 consumer for Type3 event, publishing Type4 event right after
  runMicroservice(
    "./consumers/consumer3_publisher4/app/consumer3.js",
    "Consumer3",
    2
  );
  //1 consumer for Type4 event
  runMicroservice("./consumers/consumer4/app/consumer4.js", "Consumer4", 2);

  //console.log("All consumers operational."); //this should be modified with promise resolving and await
};

//ctrl+c
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
