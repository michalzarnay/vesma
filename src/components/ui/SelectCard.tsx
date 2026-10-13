import { Tooltip } from './Tooltip';
import { FeedbackButton } from './FeedbackButton';
import { SelectionMark } from './SelectionMark';
import { jeVybrana } from './selection';

interface SelectOption {
  value: number | string;
  label: string;
  description?: string;
}

interface SelectCardProps {
  label: string;
  options: readonly SelectOption[];
  value: number | string;
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
          const isSelected = jeVybrana(value, option.value);
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={isSelected}
              className={`flex-1 flex items-start gap-2 min-w-[80px] rounded-xl border-2 px-3 py-2 text-sm text-left transition-all
                ${isSelected
                  ? 'border-[#52A8DE] bg-[#52A8DE]/5 text-[#52A8DE] font-medium'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
            >
              <span className="mt-0.5"><SelectionMark selected={isSelected} /></span>
              <span className="block">
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
