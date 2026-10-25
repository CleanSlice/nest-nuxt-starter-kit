// @scope:api
// @slice:setup/id
// @layer:presentation
// @type:validator

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { registerDecorator, ValidationOptions } from 'class-validator';
import { assertIdPrefix, isId } from './domain';

/**
 * The check behind every request field that must be an entity's primary
 * identity. The prefix is checked once, when the check is built, so a typo
 * fails at boot and not on the first request. Validation only: owning
 * services still authorize every lookup.
 */
export function entityId(prefix: string): (value: unknown) => value is string {
  assertIdPrefix(prefix);
  return (value): value is string => isId(value, prefix);
}

/** DTO property: `@IsEntityId('team') teamId: string`. */
export function IsEntityId(
  prefix: string,
  options?: ValidationOptions,
): PropertyDecorator {
  const check = entityId(prefix);
  return (target, propertyName) =>
    registerDecorator({
      name: 'isEntityId',
      target: target.constructor,
      propertyName: String(propertyName),
      options: {
        message: `${String(propertyName)} must be a ${prefix} primary identity`,
        ...options,
      },
      validator: { validate: (value: unknown) => check(value) },
    });
}

/** Route or query parameter: `@Param('id', new EntityIdPipe('user')) id: string`. */
@Injectable()
export class EntityIdPipe implements PipeTransform<unknown, string> {
  private readonly check: (value: unknown) => value is string;

  constructor(private readonly prefix: string) {
    this.check = entityId(prefix);
  }

  transform(value: unknown): string {
    if (!this.check(value)) {
      throw new BadRequestException(
        `Expected a ${this.prefix} primary identity`,
      );
    }
    return value;
  }
}
