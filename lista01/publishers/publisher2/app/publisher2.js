require("dotenv").config();
const { format } = require("date-fns");

const amqp = require("amqplib");
const Type2Event = require("../domain/type2event"); //only this changes in each publisher
const logger = require("../../../utils/logger");

class Publisher2 {
  constructor(name) {
    this.name = name ?? "Publisher2";
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
        const randomInterval = getRandomIntervalInSeconds(1, 5);
        await new Promise((resolve) =>
          setTimeout(resolve, randomInterval * 1000)
        ); //delay
        const event = new Type2Event(
          `RANDOM EVENT FROM ${this.name} - SHORT INTERVAL ${randomInterval}`
        );
        await this.sendMessage(event);
      }
    };

    await runTaskInLoop();
  }
}

const publisherName = process.argv[2] ?? "Publisher2";
const publisher = new Publisher2(publisherName);

publisher.publish().catch((error) => {
  logger.error(`Error in ${publisherName}: ${error.message}`);
});
