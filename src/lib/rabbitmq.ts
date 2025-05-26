import { Channel, ChannelModel, connect } from "amqplib";
import { config } from "dotenv";

config();

export class RabbitMq {
  private channel: Channel;
  private connection: ChannelModel;

  async start(originLog?: string) {
    const connectionUrl = process.env.RABBITMQ_CONNECTION_URL;

    if (!connectionUrl) {
      throw new Error("RabbitMq connection url is undefined!");
    }

    this.connection = await connect(connectionUrl);
    this.channel = await this.connection.createChannel();

    console.log(originLog ?? "RabbitMq is running!");
  }

  get _channel() {
    return this.channel;
  }
}
