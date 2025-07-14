import React from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';
import { FieldType, FormValues } from '@openzeppelin/transaction-form-types';
import {
  AddressField,
  AmountField,
  ArrayField,
  ArrayObjectField,
  BaseFieldProps,
  BooleanField,
  NumberField,
  ObjectField,
  PasswordField,
  RadioField,
  SelectField,
  SelectGroupedField,
  TextAreaField,
  TextField,
  UrlField,
} from '@openzeppelin/transaction-form-ui';

/**
 * Registry of field components mapped to their respective types.
 * All field components in this registry are designed specifically for React Hook Form integration
 * and are meant to be used within the DynamicFormField system, not as standalone components.
 */
export const fieldComponents: Record<
  FieldType,
  React.ComponentType<BaseFieldProps<FormValues> & { adapter?: ContractAdapter }>
> = {
  text: TextField,
  number: NumberField,
  'blockchain-address': AddressField,
  checkbox: BooleanField,
  radio: RadioField,
  select: SelectField,
  'select-grouped': SelectGroupedField,
  textarea: TextAreaField,
  date: () => React.createElement('div', null, 'Date field not implemented yet'),
  email: () => React.createElement('div', null, 'Email field not implemented yet'),
  password: PasswordField,
  amount: AmountField,
  array: ArrayField,
  object: ObjectField,
  'array-object': ArrayObjectField,
  url: UrlField,
  hidden: () => null, // Return null for hidden type
};
