require("dotenv").config();

const amqp = require("amqplib");
const Type1Event = require("../domain/type1event"); //only this changes in each publisher
const logger = require("../../../utils/logger");

class Publisher1 {
  constructor(name) {
    this.name = name ?? "Publisher1";
    this.connection = null;
    this.channel = null;
  }

  async init() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  async publish() {
    if (!this.connection || !this.channel) {
      await this.init();
    }
    let counter = 0;
    logger.info(`${this.constructor.name} begins its work`);
    setInterval(() => {
      const event = new Type1Event(
        `RECURRING EVENT FROM ${this.name} - ${counter}`
      ); //only this changes in each publisher
      const channelName = event.constructor.name; //reflection
      this.channel.assertQueue(channelName, { durable: false });
      const message = JSON.stringify({
        type: channelName,
        data: event.data,
        timestamp: event.timestamp,
      });
      this.channel.sendToQueue(channelName, Buffer.from(message));
      logger.info(
        `Published message from ${this.name} to ${channelName}: ${message}`
      );
      counter += 1;
    }, 5000);
  }
}

const publisherName = process.argv[2] ?? "Publisher1";
const publisher = new Publisher1(publisherName);
publisher.publish().catch((error) => {
  logger.error(`Error in ${publisherName}: ${error.message}`);
});
