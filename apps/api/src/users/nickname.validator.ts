import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

import { nicknameError } from '@reading/shared';

// The same rules the app shows while typing (packages/shared/src/profile.ts)
@ValidatorConstraint({ name: 'nickname' })
export class IsValidNickname implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && nicknameError(value) === null;
  }

  defaultMessage(): string {
    return 'nickname must be 3–30 characters: Latin letters, digits, "." or "_", not starting or ending with "." or "_"';
  }
}
