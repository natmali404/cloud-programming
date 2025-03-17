require("dotenv").config();

const amqp = require("amqplib");
const Type1Event = require("../domain/type1event"); //only this changes in each publisher
const logger = require("../../../utils/logger");

class Publisher1 {
  async publish() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    let counter = 0;
    logger.info(`${this.constructor.name} begins its work`);
    setInterval(() => {
      const event = new Type1Event(`RECURRING EVENT ${counter}`); //only this changes in each publisher
      const channelName = event.constructor.name; //reflection
      channel.assertQueue(channelName, { durable: false });
      const message = JSON.stringify({
        type: channelName,
        data: event.data,
        timestamp: event.timestamp,
      });
      channel.sendToQueue(channelName, Buffer.from(message));
      logger.info(
        `Published message from ${this.constructor.name} to ${channelName}: ${message}`
      );
      counter += 1;
    }, 10000);
  }
}

const publisher = new Publisher1();
publisher.publish().catch((error) => {
  logger.error(`Error in Publisher1: ${error.message}`);
});
