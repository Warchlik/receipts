export interface Repository<T> {
  findMany(id: number): Promise<T>
}

export async function assertIsMember<T>(
  id: number,
  repository: Repository<T>
): Promise<any> {
  return await repository.findMany(id)
}
