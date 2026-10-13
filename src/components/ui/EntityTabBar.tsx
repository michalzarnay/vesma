import { Check, Plus, X } from 'lucide-react';

import { textPotvrdeniaMazania } from '../../utils/vyplnenyObsah';

interface EntityTabBarProps {
  /** `vyplnene` = položka má zadaný obsah, pred zmazaním sa pýta na potvrdenie. */
  items: { id: string; label: string; vyplnene?: boolean }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addLabel: string;
  /** Druh položky v akuzatíve do potvrdenia, napr. parcelu. */
  druhMazanej?: string;
  minItems?: number;
}

export function EntityTabBar({
  items, activeIndex, onSelect, onAdd, onRemove, addLabel, druhMazanej = 'položku', minItems = 1,
}: EntityTabBarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto pb-0 mb-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={activeIndex === index ? 'true' : undefined}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeIndex === index
                ? 'border-[#52A8DE] text-brand-strong'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {activeIndex === index && <Check className="inline w-3.5 h-3.5 mr-1 -mt-0.5" strokeWidth={3} aria-hidden="true" />}
            {item.label || `#${index + 1}`}
          </button>
          {items.length > minItems && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (item.vyplnene && !confirm(textPotvrdeniaMazania(druhMazanej, item.label || `#${index + 1}`))) return;
                onRemove(index);
              }}
              className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
              aria-label={`Odstrániť ${item.label}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1 px-3 py-2 text-sm text-brand-strong hover:bg-[#52A8DE]/5 rounded-t transition-colors flex-shrink-0"
      >
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}
