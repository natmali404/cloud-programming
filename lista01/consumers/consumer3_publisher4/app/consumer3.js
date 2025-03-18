require("dotenv").config();
const { format } = require("date-fns");

const amqp = require("amqplib");
const Type3Event = require("../domain/type3event"); //only this changes in each consumer
const Type4Event = require("../domain/type4event");
const logger = require("../../../utils/logger");

//a consumer that is also a publisher
class Consumer3 {
  constructor(name) {
    this.name = name ?? "Consumer3";
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

  async consume() {
    if (!this.connection || !this.channel) {
      await this.init();
    }

    const event = new Type3Event(); //only this changes in each consumer; needed for reflection
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
        //generate type4 right after consuming type3
        const event = new Type4Event(`SPECIAL EVENT ${this.name} OCCURED`);
        await this.sendMessage(event);
      }
    });
  }
}

const consumerName = process.argv[2] ?? "Consumer3";
const consumer = new Consumer3(consumerName);

consumer.consume().catch((error) => {
  logger.error(`Error in ${consumerName}: ${error.message}`);
});
