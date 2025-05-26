import { config } from "dotenv";
import { ConsumeMessage, Message } from "amqplib";
import { UpcomingPayloadProps } from "../../types/types";
import { redis } from "../../../bootstrap";
import amqp from "amqplib";

config();
const Consumer = () => {
  const amqpConnectionUrl = process.env.RABBITMQ_CONNECTION_URL;
  if (!amqpConnectionUrl) return undefined;

  return amqp.connect(amqpConnectionUrl);
};

const ImportUsersConsumer = async () => {
  console.log("import-user-consumer is running!");

  const rabbitMq = await Consumer();
  if (!rabbitMq) return;

  const channel = await rabbitMq.createConfirmChannel();
  await channel.assertExchange("store_exchange", "topic");
  await channel.assertQueue("store", { durable: false });

  await channel.bindQueue("store", "store_exchange", "store.#");
  channel.prefetch(1);

  await redis.start();
  await channel.consume("store", async (msg: ConsumeMessage | null) => {
    if (msg) {
      const [, batchTag] = msg.fields.routingKey.split(".");
      const payload = JSON.parse(
        msg.content.toString("utf-8")
      ) as UpcomingPayloadProps[];

      console.log(`Processing ${batchTag}`);
      const storeMany = payload.map((uPayload) => {
        return new Promise(async (resolve, reject) => {
          try {
            await redis._client.set(`${uPayload.id}`, JSON.stringify(uPayload));
            const ackPayload = { msg, data: uPayload };

            resolve(ackPayload);
          } catch (error) {
            const auditErrorPayload = { error, data: uPayload };
            reject(auditErrorPayload);
          }
        });
      });

      await Promise.allSettled(storeMany).then((operations) => {
        operations.map(async (operation) => {
          if (operation.status === "fulfilled") {
            const { msg, data } = operation.value as {
              msg: Message;
              data: UpcomingPayloadProps;
            };
          }

          if (operation.status === "rejected") {
          }
        });
      });

      console.log("Whole Data has been stored!");
    }
  }, { noAck: true });
};

ImportUsersConsumer();
// Consumer connection is Closed when that is started from server.
// Apply Node.JS Worker
// Separate import-users-consumer as a possible to scale consumer with pm2.
