import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationException } from '../exceptions/custom.exceptions';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // Remove properties that don't have any decorators
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Transform types automatically
    });

    if (errors.length > 0) {
      const validationErrors = this.formatErrors(errors);
      throw new ValidationException(validationErrors);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): string[] {
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
