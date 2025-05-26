import fs from "node:fs";
import dotenv from "dotenv";
import path from "node:path";
import { UpcomingPayloadProps } from "../../types/types";
import { rabbitMq } from "../../server";

dotenv.config();

type HighLoadBatches = Record<string, UpcomingPayloadProps[]>;
export class ImportUsersService {
  async execute() {
    const jsonFilepath = path.resolve(
      __dirname,
      "../../../assets",
      process.env.NODE_ENV === "dev" ? "usuarios_1000.json" : "usuarios.json"
    );

    fs.readFile(jsonFilepath, async (err, buf) => {
      if (err && err instanceof Error) {
        throw err;
      }

      const upcomingPayloads = JSON.parse(
        buf.toString("utf-8")
      ) as UpcomingPayloadProps[];

      const highloadBatches: HighLoadBatches = {};
      const MAX_HIGHLOAD_DATA = 200;

      let [leftIndex, rightIndex] = [0, MAX_HIGHLOAD_DATA];
      let currentBatch = `${leftIndex}-${rightIndex}`;

      upcomingPayloads.map((uPayload, index) => {
        if (index >= leftIndex && index < rightIndex) {
          if (index === leftIndex || !highloadBatches[currentBatch]) {
            highloadBatches[currentBatch] = [uPayload];
          } else if (highloadBatches[currentBatch]) {
            highloadBatches[currentBatch].push(uPayload);
          }
        }

        if (index === rightIndex) {
          const msg = JSON.stringify(highloadBatches[currentBatch]);
          const topicRoutingKey = `store.${currentBatch}`;
          rabbitMq._channel.publish(
            "store_exchange",
            topicRoutingKey,
            Buffer.from(msg)
          );

          highloadBatches[currentBatch] = [];

          rightIndex += MAX_HIGHLOAD_DATA;
          leftIndex += MAX_HIGHLOAD_DATA;

          currentBatch = `${leftIndex}-${rightIndex}`;
        }
      });
    });
  }
}
