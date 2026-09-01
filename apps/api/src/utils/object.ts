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
