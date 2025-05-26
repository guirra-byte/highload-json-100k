import { ConsumeMessage } from "amqplib";
import { rabbitMq, redis } from "../server";
import { UpcomingPayloadProps } from "../types/types";

type HttpMethods = "POST" | "GET";
type PostResources = "USERS";
type GetResources =
  | "SUPERUSERS"
  | "TOP_COUNTRIES"
  | "TEAM_INSIGHTS"
  | "ACTIVE_USERS_PER_DAY"
  | "EVALUATION";

type ResourceMethodAssertion = {
  GET: GetResources;
  POST: PostResources;
};

export type ControllerTag = {
  [M in HttpMethods]: `${M}:${ResourceMethodAssertion[M]}`;
}[HttpMethods];

interface RequestCachePayload {
  tag: ControllerTag;
  payload: UpcomingPayloadProps;
}

const execute = async (msg: ConsumeMessage | null) => {
  if (msg) {
    const { tag, payload } = JSON.parse(
      msg.content.toString("utf-8")
    ) as RequestCachePayload;

    await redis._client.set(`${tag}`, JSON.stringify(payload));

    console.log(`API resource: ${tag} has cached in Redis!`);
  }
};

const CacheRequestConsumer = async () => {
  rabbitMq._channel.consume(
    "cache_request",
    (msg: ConsumeMessage | null) => execute(msg)
  );
};

CacheRequestConsumer();
