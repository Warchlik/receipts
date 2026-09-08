import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NewProfile, Profile } from "./profiles.types";

export class ProfilesRepository {
  async findByUserId(userId: string): Promise<Profile | null> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId));

    return profile ?? null;
  }

  async upsert(
    userId: string,
    data: Partial<Omit<NewProfile, "id">>,
  ): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values({ id: userId, ...data })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { ...data, updated_at: new Date() },
      })
      .returning();

    if (!profile) {
      throw new Error("Failed to upsert profile");
    }

    return profile;
  }
}
