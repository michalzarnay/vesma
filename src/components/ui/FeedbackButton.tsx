import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackDialog } from './FeedbackDialog';

interface FeedbackButtonProps {
  fieldLabel: string;
}

export function FeedbackButton({ fieldLabel }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Pridať podnet"
        className="ml-1 flex-shrink-0 text-gray-300 hover:text-[#52A8DE] transition-colors focus:outline-none"
        aria-label="Pridať podnet"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
      </button>
      {open && (
        <FeedbackDialog fieldLabel={fieldLabel} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
