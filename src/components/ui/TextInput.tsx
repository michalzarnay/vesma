import { Tooltip } from './Tooltip';
import { FeedbackButton } from './FeedbackButton';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tooltipKey?: string;
  tooltipText?: string;
  multiline?: boolean;
  className?: string;
  /** Len vizuálne označenie hviezdičkou; validáciu rieši stepValidation. */
  required?: boolean;
}

export function TextInput({
  label, value, onChange, placeholder, tooltipKey, tooltipText, multiline = false, className = '', required = false,
}: TextInputProps) {
  const inputClasses = "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="flex items-center text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
        {(tooltipKey || tooltipText) && <Tooltip glossaryKey={tooltipKey} text={tooltipText} />}
        <FeedbackButton fieldLabel={label} />
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={inputClasses}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  );
}
