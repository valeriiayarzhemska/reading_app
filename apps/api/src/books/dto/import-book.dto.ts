import {
  IsEnum,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

import { BookSource } from '@reading/shared';

import { isValidExternalId } from '../external-id.js';

// Custom rule: the ID format depends on another field (source), which the
// built-in decorators can't express. args.object is the whole DTO.
@ValidatorConstraint({ name: 'externalIdMatchesSource' })
class ExternalIdMatchesSource implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const { source } = args.object as ImportBookDto;

    return typeof value === 'string' && isValidExternalId(source, value);
  }

  defaultMessage(): string {
    return 'externalId has an invalid format for this source';
  }
}

export class ImportBookDto {
  @IsEnum(BookSource)
  source: BookSource;

  @Validate(ExternalIdMatchesSource)
  externalId: string;
}
