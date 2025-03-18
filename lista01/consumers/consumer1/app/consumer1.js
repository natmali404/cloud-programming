require("dotenv").config();

const amqp = require("amqplib");
const Type1Event = require("../domain/type1event"); //only this changes in each consumer
const logger = require("../../../utils/logger");

function simulateWork(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class Consumer1 {
  constructor(name) {
    this.name = name ?? "Consumer1";
    this.connection = null;
    this.channel = null;
  }

  async init() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  async consume() {
    if (!this.connection || !this.channel) {
      await this.init();
    }

    const event = new Type1Event(); //only this changes in each consumer
    const channelName = event.constructor.name; //reflection...?

    await this.channel.assertQueue(channelName, {
      durable: false,
      exclusive: false,
    });

    this.channel.prefetch(1); //this causes the consumer to only receive one message before it is acknowledged

    logger.info(`Consumer ${this.name} subscribed to channel: ${channelName}`);

    this.channel.consume(channelName, async (msg) => {
      if (msg !== null) {
        const message = msg.content.toString();
        await simulateWork(1000);
        this.channel.ack(msg);
        logger.info(
          `${this.name} consumed message from ${channelName}: ${message}`
        );
      }
    });
  }
}
const consumerName = process.argv[2] ?? "Consumer1";
const consumer = new Consumer1(consumerName);
consumer.consume().catch((error) => {
  logger.error(`Error in ${consumerName}: ${error.message}`);
});
