import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

export function isTimeZone(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > 64) {
    return false;
  }

  // Intl throws a RangeError for an unknown zone. Node and Postgres both use
  // the IANA database, so a name Intl accepts is safe in AT TIME ZONE too.
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });

    return true;
  } catch {
    return false;
  }
}

@ValidatorConstraint({ name: 'timeZone' })
export class IsTimeZone implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isTimeZone(value);
  }

  defaultMessage(): string {
    return 'timezone must be an IANA name such as Europe/Kyiv';
  }
}
