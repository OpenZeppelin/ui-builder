import React from 'react';

import type { FormFieldType } from '@openzeppelin/ui-builder-types';

interface Props {
  keyField: FormFieldType;
  valueField: FormFieldType;
  isDuplicateKey: boolean;
  renderKeyField?: (field: FormFieldType, entryIndex: number) => React.ReactNode;
  renderValueField?: (field: FormFieldType, entryIndex: number) => React.ReactNode;
  index: number;
}

export function MapEntryRow({
  keyField,
  valueField,
  isDuplicateKey,
  renderKeyField,
  renderValueField,
  index,
}: Props): React.ReactElement {
  return (
    <div className="flex-1 grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-1">
        {renderKeyField ? (
          <>
            {renderKeyField(keyField, index)}
            {isDuplicateKey && (
              <div className="text-destructive mt-1 text-sm" role="alert">
                Duplicate keys are not allowed
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground p-2 border border-dashed border-border rounded">
            Key field type &ldquo;{keyField.type}&rdquo; requires a render function
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {renderValueField ? (
          renderValueField(valueField, index)
        ) : (
          <div className="text-sm text-muted-foreground p-2 border border-dashed border-border rounded">
            Value field type &ldquo;{valueField.type}&rdquo; requires a render function
          </div>
        )}
      </div>
    </div>
  );
}
