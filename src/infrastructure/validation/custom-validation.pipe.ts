import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationException } from '../exceptions/custom.exceptions';

@Injectable()
export class CustomValidationPipe implements PipeTransform<unknown> {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value as Record<string, unknown>, {
      enableImplicitConversion: true,
    });
    const errors = await validate(object as object, {
      whitelist: true, // Remove properties that don't have any decorators
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
    });

    if (errors.length > 0) {
      const validationErrors = this.formatErrors(errors);
      throw new ValidationException(validationErrors);
    }

    return object;
  }

  private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
    const types: (new (...args: unknown[]) => unknown)[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }

  private formatErrors(
    errors: import('class-validator').ValidationError[],
  ): string[] {
    const result: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        result.push(
          ...Object.values(error.constraints).map((constraint) =>
            String(constraint),
          ),
        );
      }

      if (error.children && error.children.length > 0) {
        result.push(...this.formatErrors(error.children));
      }
    }

    return result;
  }
}
