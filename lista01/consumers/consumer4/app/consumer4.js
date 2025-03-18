require("dotenv").config();

const amqp = require("amqplib");
const Type4Event = require("../domain/type4event");
const logger = require("../../../utils/logger");

//a consumer that is also a publisher
class Consumer4 {
  constructor(name) {
    this.name = name ?? "Consumer4";
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

    const event = new Type4Event(); //only this changes in each consumer; needed for reflection
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

const consumerName = process.argv[2] ?? "Consumer4";
const consumer = new Consumer4(consumerName);

consumer.consume().catch((error) => {
  logger.error(`Error in ${consumerName}: ${error.message}`);
});
