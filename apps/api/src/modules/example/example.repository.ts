import { db } from "@/db";
import { examples } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { Example, NewExample } from "./example.types";

export class ExampleRepository {
  async count() {
    const [result] = await db
      .select({
        value: count(),
      })
      .from(examples);

    return result?.value ?? 0;
  }

  async findMany(
    offset: number,
    limit: number = 20
  ): Promise<Example[]> {
    return await db
      .select()
      .from(examples)
      .limit(limit)
      .offset(offset);
  }

  async findById(
    id: string
  ): Promise<Example | null> {
    const [example] = await db
      .select()
      .from(examples)
      .where(eq(examples.id, id));

    return example ?? null;
  }

  async create(
    data: NewExample
  ): Promise<Example | null> {
    const [example] = await db
      .insert(examples)
      .values(data)
      .returning();

    return example ?? null;
  }

  async update(
    id: string,
    data: Partial<NewExample>
  ): Promise<Example | null> {
    const [example] = await db
      .update(examples)
      .set(data)
      .where(eq(examples.id, id))
      .returning();

    return example ?? null;
  }

  async delete(
    id: string
  ): Promise<Example | null> {
    const [example] = await db
      .delete(examples)
      .where(eq(examples.id, id))
      .returning();

    return example ?? null;
  }
}
