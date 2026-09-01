import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackDialog } from './FeedbackDialog';

interface FeedbackButtonProps {
  fieldLabel?: string;
  variant?: 'inline' | 'header';
}

export function FeedbackButton({ fieldLabel, variant = 'inline' }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Pridať podnet"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Podnet</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Pridať podnet"
          className="ml-1 flex-shrink-0 text-gray-300 hover:text-[#52A8DE] transition-colors focus:outline-none"
          aria-label="Pridať podnet"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
        </button>
      )}
      {open && (
        <FeedbackDialog fieldLabel={fieldLabel} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
