import { Info } from 'lucide-react';

import { Banner } from '@openzeppelin/ui-components';

interface FunctionNoteSectionProps {
  note: { title?: string; body: string } | undefined;
  isDismissed: boolean;
  onDismiss: () => void;
}

/**
 * Displays a dismissible banner with information about the selected function's requirements.
 * This is typically used to indicate when a function requires a runtime secret or has
 * other special execution requirements.
 */
export function FunctionNoteSection({ note, isDismissed, onDismiss }: FunctionNoteSectionProps) {
  if (!note || isDismissed) {
    return null;
  }

  return (
    <Banner title={note.title} onDismiss={onDismiss} icon={<Info className="size-5" />}>
      {note.body}
    </Banner>
  );
}
