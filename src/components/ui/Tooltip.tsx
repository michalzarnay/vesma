import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { glossary, GlossaryEntry } from '../../data/glossary';

interface TooltipProps {
  glossaryKey?: string;
  text?: string;
  example?: string;
  whereToFind?: string;
}

export function Tooltip({ glossaryKey, text, example, whereToFind }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  let entry: GlossaryEntry | undefined;
  if (glossaryKey && glossary[glossaryKey]) {
    entry = glossary[glossaryKey];
  }

  const displayText = text || entry?.definition || '';
  const displayExample = example || entry?.example;
  const displayWhereToFind = whereToFind || entry?.whereToFind;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!displayText) return null;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 text-gray-400 hover:text-brand-strong transition-colors focus:outline-none focus:ring-2 focus:ring-[#2196F3] rounded-full"
        aria-label="Zobraziť nápovedu"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-sm text-gray-700">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45 -translate-y-1.5" />
          </div>
          <p>{displayText}</p>
          {displayExample && (
            <p className="mt-2 text-gray-500 italic">
              <span className="font-medium not-italic">Príklad: </span>{displayExample}
            </p>
          )}
          {displayWhereToFind && (
            <p className="mt-2 text-blue-600 text-xs">
              <span className="font-medium">Kde nájsť: </span>{displayWhereToFind}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
