import type { ComponentProps } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { TextField } from '@/components/ui/text-field';

type FormTextFieldProps<TValues extends FieldValues, TTransformed> = Omit<
  ComponentProps<typeof TextField>,
  'value' | 'onChangeText' | 'onBlur' | 'error'
> & {
  control: Control<TValues, unknown, TTransformed>;
  name: FieldPath<TValues>;
  // The schema reports codes; the screen turns them into translated text
  translateError: (code: string) => string;
};

// TextInput isn't an HTML <input>, so react-hook-form can't attach to it
// directly: useController hands us value / onChange / onBlur to wire by hand
export function FormTextField<TValues extends FieldValues, TTransformed>({
  control,
  name,
  translateError,
  ...inputProps
}: FormTextFieldProps<TValues, TTransformed>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <TextField
      {...inputProps}
      value={field.value}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={
        fieldState.error?.message
          ? translateError(fieldState.error.message)
          : undefined
      }
    />
  );
}
