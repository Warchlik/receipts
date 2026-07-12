import { ApiError } from "@/utils/ApiError";
import { ExampleRepository } from "./example.repository";
import {
  Example,
  NewExample,
  PaginationExamples,
} from "./example.types";
import {
  getPaginationMeta,
  PaginationParams,
} from "@/utils/pagination";

export class ExampleService {
  constructor(
    private readonly exampleRepository: ExampleRepository,
  ) { }

  async getExamples(
    pagination: PaginationParams,
  ): Promise<PaginationExamples> {
    const [example, total] = await Promise.all([
      this.exampleRepository.findMany(
        pagination.offset,
        pagination.limit,
      ),
      this.exampleRepository.count(),
    ]);

    return {
      data: example,
      meta: getPaginationMeta(
        total,
        pagination.page,
        pagination.limit,
      ),
    };
  }

  async getExampleById(
    id: string
  ): Promise<Example> {
    const example =
      await this.exampleRepository.findById(id);

    if (!example) {
      throw new ApiError(404, "Example not found");
    }

    return example;
  }

  async createExample(
    data: NewExample
  ): Promise<Example> {
    const example =
      await this.exampleRepository.create(data);

    if (!example) {
      throw new ApiError(404, "Can not create new Example");
    }

    return example;
  }

  async updateExample(
    id: string,
    data: Partial<NewExample>,
  ): Promise<Example> {
    const existingExample =
      await this.exampleRepository.findById(id);

    if (!existingExample) {
      throw new ApiError(404, "Example not exsist");
    }

    const example = await this.exampleRepository.update(
      id,
      data,
    );

    if (!example) {
      throw new ApiError(404, "Could not update example");
    }

    return example;
  }

  async deleteExample(
    id: string
  ): Promise<void> {
    const existingExample =
      await this.exampleRepository.findById(id);

    if (!existingExample) {
      throw new ApiError(404, "Example not found");
    }

    await this.exampleRepository.delete(id);
  }
}
