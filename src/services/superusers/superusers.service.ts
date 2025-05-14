import { ICacheProvider } from "../../utils/cache";
import { UpcomingPayloadProps } from "../../types/types";

export class SuperusersService {
  users: UpcomingPayloadProps[];
  constructor(private cacheProvider: ICacheProvider) {}

  async execute(ownControllerTag: string) {
    const superusers = this.users.filter((u) => u.score >= 900 && u.ativo);
    await this.cacheProvider.set(ownControllerTag, JSON.stringify(superusers));
  }
}
