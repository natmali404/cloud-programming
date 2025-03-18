require("dotenv").config();
const { format } = require("date-fns");

const amqp = require("amqplib");
const Type3Event = require("../domain/type3event"); //only this changes in each publisher
const logger = require("../../../utils/logger");

class Publisher3 {
  constructor(name) {
    this.name = name ?? "Publisher3";
    this.connection = null;
    this.channel = null;
  }

  async init() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  async sendMessage(event) {
    const channelName = event.constructor.name; //reflection
    await this.channel.assertQueue(channelName, { durable: false });

    const message = `MSG OF TYPE ${channelName} AT ${format(
      event.timestamp.toISOString(),
      "yyyy-MM-dd HH:mm:ss.SS"
    )} - ${event.data}]`;

    this.channel.sendToQueue(channelName, Buffer.from(message));

    logger.info(
      `Published message from ${this.name} to ${channelName}: ${message}`
    );
  }

  async publish() {
    if (!this.connection || !this.channel) {
      await this.init();
    }

    logger.info(`${this.constructor.name} begins its work`);

    const getRandomIntervalInSeconds = (min, max) =>
      (Math.random() * (max - min) + min).toFixed(1);

    //create a loop
    //while it runs, create a task with random interval.
    //send the message, after its sent, mark it as done (promise resolve...?)
    const runTaskInLoop = async () => {
      while (true) {
        const randomInterval = getRandomIntervalInSeconds(5, 15);
        await new Promise((resolve) =>
          setTimeout(resolve, randomInterval * 1000)
        ); //delay
        const event = new Type3Event(
          `RANDOM EVENT FROM ${this.name} - LONG INTERVAL ${randomInterval}`
        );
        await this.sendMessage(event);
      }
    };

    await runTaskInLoop();
  }
}

const publisherName = process.argv[2] ?? "Publisher3";
const publisher = new Publisher3(publisherName);

publisher.publish().catch((error) => {
  logger.error(`Error in ${publisherName}: ${error.message}`);
});
