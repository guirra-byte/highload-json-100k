import { ConsumeMessage } from "amqplib";
import { rabbitMqServer, redisServer } from "../server";

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
  // payload: Upcoming
}

const execute = async (msg: ConsumeMessage | null) => {
  if (msg) {
  }
};

const CacheRequestConsumer = async () => {
  rabbitMqServer.channel.consume(
    "cache_request",
    (msg: ConsumeMessage | null) => execute(msg)
  );
};

CacheRequestConsumer();
