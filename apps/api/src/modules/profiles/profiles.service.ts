import { stripUndefined } from "@/utils/object";
import { ProfilesRepository } from "./profiles.repository";
import { UpdateProfileInput } from "./profiles.schema";
import { Profile } from "./profiles.types";

export class ProfilesService {
  constructor(private readonly profilesRepository: ProfilesRepository) {}

  async getMyProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findByUserId(userId);

    if (profile) {
      return profile;
    }

    // Falls back to creating the row for accounts predating the auth hook.
    return this.profilesRepository.upsert(userId, {});
  }

  async updateMyProfile(
    userId: string,
    data: UpdateProfileInput,
  ): Promise<Profile> {
    return this.profilesRepository.upsert(userId, stripUndefined(data));
  }
}
