import { Tooltip } from './Tooltip';
import { FeedbackButton } from './FeedbackButton';

interface PercentageField {
  key: string;
  label: string;
  tooltipKey?: string;
  tooltipText?: string;
}

interface PercentageGroupProps {
  title: string;
  fields: PercentageField[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  tooltipKey?: string;
  tooltipText?: string;
}

export function PercentageGroup({
  title, fields, values, onChange, tooltipKey, tooltipText,
}: PercentageGroupProps) {
  const total = fields.reduce((sum, f) => sum + (values[f.key] || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01 || total === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center text-sm font-medium text-gray-700">
          {title}
          {(tooltipKey || tooltipText) && <Tooltip glossaryKey={tooltipKey} text={tooltipText} />}
          <FeedbackButton fieldLabel={title} />
        </h4>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          total === 0
            ? 'bg-gray-100 text-gray-500'
            : isValid
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
        }`}>
          Súčet: {Math.round(total)}%
          {!isValid && total > 0 && ' (musí byť 100%)'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center gap-2">
            <label className="flex-1 flex items-center text-xs text-gray-600 min-w-0">
              <span className="truncate">{field.label}</span>
              {(field.tooltipKey || field.tooltipText) && (
                <Tooltip glossaryKey={field.tooltipKey} text={field.tooltipText} />
              )}
              <FeedbackButton fieldLabel={`${title} – ${field.label}`} />
            </label>
            <div className="relative w-20 flex-shrink-0">
              <input
                type="number"
                value={values[field.key] || ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0 && v <= 100) onChange(field.key, v);
                }}
                min={0}
                max={100}
                step={1}
                placeholder="0"
                style={{ paddingRight: '1.25rem' }}
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-right focus:border-[#52A8DE] focus:ring-1 focus:ring-[#52A8DE]/20 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                %
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
