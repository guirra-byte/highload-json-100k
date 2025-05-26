import { RedisClientType, createClient } from "redis";

export class Redis {
  private client: RedisClientType;

  async start(originLog?: string) {
    this.client = createClient();
    await this.client.connect();

    console.log(originLog ?? "Redis is running!");
  }

  get _client() {
    return this.client;
  }
}
