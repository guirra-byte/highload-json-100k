import fs from "node:fs";
import dotenv from "dotenv";
import path from "node:path";
import { UpcomingPayloadProps } from "../../types/types";
import { rabbitMqServer } from "../../server";

dotenv.config();

type HighLoadBatches = Record<string, UpcomingPayloadProps[]>;
export class ImportUsersService {
  async execute() {
    let jsonFilepath = "";
    if (process.env.NODE_ENV === "dev") {
      jsonFilepath = path.resolve(
        __dirname,
        "../../assets",
        "usuarios_1000.json"
      );
    }

    fs.readFile(jsonFilepath, (err, buf) => {
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
        if (index > leftIndex && index < rightIndex) {
          if (index === leftIndex || !highloadBatches[currentBatch]) {
            highloadBatches[currentBatch] = [uPayload];
          } else if (highloadBatches[currentBatch]) {
            highloadBatches[currentBatch].push(uPayload);
          }
        }

        if (index === rightIndex) {
          const brokerData = JSON.stringify(highloadBatches[currentBatch]);
          rabbitMqServer.publish("store", brokerData);

          highloadBatches[currentBatch] = [];
          
          rightIndex += MAX_HIGHLOAD_DATA;
          leftIndex += MAX_HIGHLOAD_DATA;

          currentBatch = `${leftIndex}-${rightIndex}`;
        }
      });
    });
  }
}
