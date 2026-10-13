import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { DOTYK_MOBIL } from '../../utils/nazovKrokuMobil';
import { FeedbackDialog } from './FeedbackDialog';

interface FeedbackButtonProps {
  fieldLabel?: string;
  variant?: 'inline' | 'header';
  /**
   * Predvyplnený „Názov prvku" pri všeobecnom podnete (bez `fieldLabel`) —
   * napr. aktuálny krok, aby stĺpec „kde" v hárku nebol nikdy prázdny.
   */
  predvyplnenyPrvok?: string;
}

export function FeedbackButton({ fieldLabel, variant = 'inline', predvyplnenyPrvok }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Pridať podnet"
          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 ${DOTYK_MOBIL} text-xs font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors`}
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Podnet</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Pridať podnet"
          className={`ml-1 flex-shrink-0 inline-flex items-center justify-center ${DOTYK_MOBIL} -my-3 sm:my-0 text-gray-500 hover:text-brand-strong transition-colors focus:outline-none`}
          aria-label="Pridať podnet"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
        </button>
      )}
      {open && (
        <FeedbackDialog fieldLabel={fieldLabel} predvyplnenyPrvok={predvyplnenyPrvok} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
