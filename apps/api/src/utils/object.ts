// Zod's `.optional()` infers property values as `T | undefined` explicitly,
// which conflicts with `exactOptionalPropertyTypes` when handed to a "clean"
// optional target (e.g. drizzle's `Partial<NewX>` for a column that has no
// default). This drops keys whose value is `undefined` so the result is safe
// to pass into `.update(...).set(...)`.
type CleanPartial<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

export const stripUndefined = <T extends object>(
  input: T,
): CleanPartial<T> => {
  const result: Record<string, unknown> = {};

  (Object.keys(input) as (keyof T)[]).forEach((key) => {
    const value = input[key];

    if (value !== undefined) {
      result[key as string] = value;
    }
  });

  return result as CleanPartial<T>;
};
