import "dotenv/config";
import { ConsumeMessage, Message } from "amqplib";
import { UpcomingPayloadProps } from "../../types/types";
import { rabbitMq, redis } from "../../../bootstrap";

const execute = async (msg: ConsumeMessage | null) => {
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

          rabbitMq._channel.ack(msg);
          console.log(`${data.id} has been processed!`);
        }

        if (operation.status === "rejected") {
        }
      });
    });

    console.log("Whole Data has been stored!");
  }
};

const ImportUsersConsumer = async () => {
  console.log("import-user-consumer is running!");
  await rabbitMq.start("RabbitMq is running in import-user-consumer");
  await redis.start("Redis is running in import-user-consumer");

  await rabbitMq._channel.assertExchange("store_exchange", "topic");
  await rabbitMq._channel.assertQueue("store", { durable: false });

  await rabbitMq._channel.bindQueue("store", "store_exchange", "store.#");
  rabbitMq._channel.prefetch(1);
  await rabbitMq._channel.consume("store", (msg: ConsumeMessage | null) =>
    execute(msg)
  );
};

ImportUsersConsumer();
// Consumer connection is Closed when that is started from server.
// Apply Node.JS Worker
// Separate import-users-consumer as a possible to scale consumer with pm2.
