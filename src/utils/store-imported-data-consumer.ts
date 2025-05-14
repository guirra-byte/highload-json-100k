import { ConsumeMessage, Message } from "amqplib";
import { rabbitMqServer, redisServer } from "../server";
import { UpcomingPayloadProps } from "../types/types";

const execute = async (msg: ConsumeMessage | null) => {
  if (msg) {
    const { content } = msg;

    const data = JSON.parse(
      content.toString("utf-8")
    ) as UpcomingPayloadProps[];

    const storeMany = data.map((uPayload) => {
      return new Promise(async (resolve, reject) => {
        try {
          redisServer.client.set(`${uPayload.id}`, JSON.stringify(uPayload));
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
          const { msg } = operation.value as {
            msg: Message;
            data: UpcomingPayloadProps;
          };

          rabbitMqServer.channel.ack(msg);
        }

        if (operation.status === "rejected") {
          
        }
      });
    });
  }
};

const StoreImportedDataConsumer = async () => {
  rabbitMqServer.channel.consume("store", (msg: ConsumeMessage | null) =>
    execute(msg)
  );
};

StoreImportedDataConsumer();
