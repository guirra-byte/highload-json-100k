import { ControllerTag } from "../../controllers/cache-request-consumer";
import { redis } from "../../server";

export async function cachedReplyMiddleware(controllerTag: ControllerTag) {
  const cachedResponse = await redis._client.get(controllerTag);
  if (!cachedResponse) {
    return null;
  }
  
  return cachedResponse;
}
