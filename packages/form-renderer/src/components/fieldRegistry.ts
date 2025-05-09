import React from 'react';

import type { ContractAdapter } from '@openzeppelin/transaction-form-types';
import { FieldType, FormValues } from '@openzeppelin/transaction-form-types';

import { BaseFieldProps } from './fields/BaseField';

import { AddressField, BooleanField, NumberField, TextField } from './fields';

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
  radio: () => React.createElement('div', null, 'Radio field not implemented yet'),
  select: () => React.createElement('div', null, 'Select field not implemented yet'),
  textarea: () => React.createElement('div', null, 'Textarea field not implemented yet'),
  date: () => React.createElement('div', null, 'Date field not implemented yet'),
  email: () => React.createElement('div', null, 'Email field not implemented yet'),
  password: () => React.createElement('div', null, 'Password field not implemented yet'),
  amount: () => React.createElement('div', null, 'Amount field not implemented yet'),
  hidden: () => null, // Return null for hidden type
};
