import { Check } from 'lucide-react';
import { jeMoznostVybrana } from '../../utils/vyber';
import { Tooltip } from './Tooltip';
import { FeedbackButton } from './FeedbackButton';

interface SelectOption {
  value: number | string;
  label: string;
  description?: string;
}

interface SelectCardProps {
  label: string;
  options: readonly SelectOption[];
  value: number | string | null | undefined;
  onChange: (value: number | string) => void;
  tooltipKey?: string;
  tooltipText?: string;
  layout?: 'horizontal' | 'vertical';
  /** Nevyplnené nové pole po načítaní staršej relácie — orámuje sa červeno (issue #177). */
  highlight?: boolean;
}

export function SelectCard({
  label, options, value, onChange, tooltipKey, tooltipText, layout = 'horizontal',
  highlight = false,
}: SelectCardProps) {
  return (
    <div className={`space-y-2 ${highlight ? 'border-2 border-red-400 rounded-xl p-3 bg-red-50/40' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 flex items-center">
        {label}
        {(tooltipKey || tooltipText) && <Tooltip glossaryKey={tooltipKey} text={tooltipText} />}
        <FeedbackButton fieldLabel={label} />
        {highlight && (
          <span className="ml-2 text-xs font-normal text-red-600">nové pole — doplňte</span>
        )}
      </label>
      <div role="group" aria-label={label} className={`flex gap-2 ${layout === 'vertical' ? 'flex-col' : 'flex-wrap'}`}>
        {options.map((option) => {
          const isSelected = jeMoznostVybrana(value, option.value);
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              className={`flex-1 min-w-[80px] flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm text-left transition-all
                ${isSelected
                  ? 'border-[#52A8DE] bg-[#52A8DE]/5 text-brand-ink font-medium shadow-sm ring-1 ring-[#52A8DE]'
                  : 'border-gray-200 bg-surface text-gray-600 hover:border-gray-300'
                }`}
            >
              {/* Indikátor výberu nezávislý od farby: vyplnený kruh s fajkou vs. prázdny kruh (podnet č. 96). */}
              <span
                aria-hidden="true"
                data-vybrane={isSelected ? 'true' : 'false'}
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2
                  ${isSelected ? 'border-[#52A8DE] bg-brand-strong text-white' : 'border-gray-400 bg-surface'}`}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={4} />}
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{option.label}</span>
                {option.description && (
                  <span className="block text-xs mt-0.5 opacity-70">{option.description}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
