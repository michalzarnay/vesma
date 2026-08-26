import { useState, useRef, useCallback, useEffect } from 'react';
import { Tooltip } from './Tooltip';
import { FeedbackButton } from './FeedbackButton';

interface ComboboxInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  tooltipKey?: string;
  tooltipText?: string;
  className?: string;
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function ComboboxInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  tooltipKey,
  tooltipText,
  className = '',
}: ComboboxInputProps) {
  const [inputText, setInputText] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync inputText when value changes externally
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const filtered = isOpen
    ? options
        .filter((opt) => stripDiacritics(opt).includes(stripDiacritics(inputText)))
        .slice(0, 50)
    : [];

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setInputText(text);
      setIsOpen(true);
      // If the user clears the input, also clear the value
      if (text === '') {
        onChange('');
      }
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (option: string) => {
      setInputText(option);
      onChange(option);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleFocus = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Small delay so click on option fires before we close
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      // If text doesn't exactly match any option, keep it as a free-text value
      onChange(inputText);
    }, 150);
  }, [inputText, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    []
  );

  const inputClasses =
    'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none';

  return (
    <div className={`flex flex-col gap-1 relative ${className}`} ref={containerRef}>
      <label className="flex items-center text-sm font-medium text-gray-700">
        {label}
        {(tooltipKey || tooltipText) && (
          <Tooltip glossaryKey={tooltipKey} text={tooltipText} />
        )}
        <FeedbackButton fieldLabel={label} />
      </label>
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClasses}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <ul
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()} // prevent blur before click
        >
          {filtered.map((option) => (
            <li
              key={option}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-[#52A8DE]/10 hover:text-[#52A8DE]"
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
