require("dotenv").config();

const amqp = require("amqplib");
const Type2Event = require("../domain/type2event"); //only this changes in each consumer
const logger = require("../../../utils/logger");

class Consumer2 {
  constructor(name) {
    this.name = name ?? "Consumer2";
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

    const event = new Type2Event(); //only this changes in each consumer; needed for reflection
    const channelName = event.constructor.name; //reflection

    await this.channel.assertQueue(channelName, {
      durable: false,
      exclusive: false,
    });

    this.channel.prefetch(1); //this causes the consumer to only receive one message before it is acknowledged

    logger.info(`Consumer ${this.name} subscribed to channel: ${channelName}`);

    this.channel.consume(channelName, async (msg) => {
      if (msg !== null) {
        const message = msg.content.toString();
        this.channel.ack(msg);
        logger.info(
          `${this.name} consumed message from ${channelName}: ${message}`
        );
      }
    });
  }
}

const consumerName = process.argv[2] ?? "Consumer2";
const consumer = new Consumer2(consumerName);

consumer.consume().catch((error) => {
  logger.error(`Error in ${consumerName}: ${error.message}`);
});
