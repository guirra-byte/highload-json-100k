import { RabbitMq } from "./src/lib/rabbitmq";
import { Redis } from "./src/lib/redis";

const rabbitMq = new RabbitMq();
const redis = new Redis();

export { rabbitMq, redis };
