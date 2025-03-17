require("dotenv").config();

const amqp = require("amqplib");
const Type1Event = require("../domain/type1event"); //only this changes in each consumer
const logger = require("../../../utils/logger");

class Consumer1 {
  async consume() {
    const event = new Type1Event(); //only this changes in each consumer

    const channelName = event.constructor.name; //??????? Reflection...?

    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(channelName, { durable: false });

    logger.info(
      `Consumer ${this.constructor.name} subscribed to channel: ${channelName}`
    );

    channel.consume(channelName, (msg) => {
      if (msg !== null) {
        const message = msg.content.toString();
        logger.info(`Consumed message from ${channelName}: ${message}`);
        channel.ack(msg);
      }
    });
  }
}

const consumer = new Consumer1();
consumer.consume().catch((error) => {
  logger.error(`Error in Consumer1: ${error.message}`);
});
