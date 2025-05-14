import redis, { RedisClientType } from "redis";

export class RedisServer {
  private _instance: RedisClientType;

  async createConnection() {
    if (!this._instance) {
      this._instance = redis.createClient();
    }

    console.log("Redis Server is running!");
  }

  get client() {
    return this._instance;
  }
}
