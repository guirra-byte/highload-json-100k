import { Channel, ChannelModel, connect } from "amqplib";

class RabbitMqServer {
  private _channel: Channel;
  private connection: ChannelModel;

  async createConnection() {
    const connectionUrl = process.env.RABBITMQ_CONNECTION_URL;
    if (connectionUrl) {
      this.connection = await connect(connectionUrl);
      this._channel = await this.connection.createChannel();
    }

    console.log("RabbitMq Server is running!");
  }

  get channel(): Channel {
    return this._channel;
  }

  async publish(
    queue: string,
    message: string,
    persistent: boolean = false,
    headers: any = {}
  ) {
    this._channel.assertQueue(queue);
    this._channel.publish("", queue, Buffer.from(message), {
      persistent,
      headers,
    });

    return;
  }

  async consume(queue: string, cb: (msg: any) => void) {
    await this._channel.assertQueue(queue);
    this._channel.consume(queue, cb);
    return;
  }
}

export { RabbitMqServer };
