import { linkError } from '@reading/shared';
import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

// The same rule the app shows while typing (packages/shared/src/profile.ts)
@ValidatorConstraint({ name: 'profileLink' })
export class IsProfileLink implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && linkError(value) === null;
  }

  defaultMessage(): string {
    return 'each link must be a valid https:// URL of at most 200 characters';
  }
}
