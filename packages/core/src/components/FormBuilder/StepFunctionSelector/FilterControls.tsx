import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import type { FilterControlsProps } from './types';

export function FilterControls({
  filterValue,
  setFilterValue,
  showReadOnlyFunctions,
  setShowReadOnlyFunctions,
}: FilterControlsProps) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Filter functions..."
        className="w-full rounded border p-2"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-readonly"
          checked={showReadOnlyFunctions}
          onCheckedChange={(checked) => setShowReadOnlyFunctions(checked === true)}
        />
        <Label htmlFor="show-readonly" className="text-sm">
          Show read-only functions (view/pure)
        </Label>
      </div>
    </div>
  );
}
