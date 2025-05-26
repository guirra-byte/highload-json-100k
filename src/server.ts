import { FastifyReply, FastifyRequest } from "fastify";
import { app } from "./app";
import { cachedReplyMiddleware } from "./utils/middleware/cached-reply-middleware";
import { ControllerTag } from "./controllers/cache-request-consumer";
import { ImportUsersService } from "./services/import/import-users";
import "./services/import/import-users-consumer";
import { rabbitMq, redis } from "../bootstrap";

const cachePreHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const rsrc = request.url.split("/")[1].replaceAll("-", "_").toUpperCase();
  const requestCacheKey = `${request.method}:${rsrc}` as ControllerTag;

  const cached = await cachedReplyMiddleware(requestCacheKey);
  if (cached) {
    console.log("Reply was cached!");
    return reply.send(JSON.parse(cached));
  }
};

const importUsersService = new ImportUsersService();
app.route({
  method: "POST",
  url: "/users",
  preHandler: cachePreHandler,
  handler: async (_request: FastifyRequest, reply: FastifyReply) => {
    await importUsersService.execute();
    return reply.send().status(201);
  },
});

async function main() {
  await app.listen({ port: 3001 });

  console.log("highload-json-100k server is running!");
  await redis.start();
  await rabbitMq.start();
}

main();
export { rabbitMq, redis };
