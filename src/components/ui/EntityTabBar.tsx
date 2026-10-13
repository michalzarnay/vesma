import { Plus, X, Check } from 'lucide-react';

interface EntityTabBarProps {
  items: { id: string; label: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addLabel: string;
  minItems?: number;
}

export function EntityTabBar({
  items, activeIndex, onSelect, onAdd, onRemove, addLabel, minItems = 1,
}: EntityTabBarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto pb-0 mb-4">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={activeIndex === index ? 'true' : undefined}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeIndex === index
                ? 'border-[#52A8DE] text-[#52A8DE]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {activeIndex === index && <Check aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={3} />}
            {item.label || `#${index + 1}`}
          </button>
          {items.length > minItems && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(index); }}
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
        className="flex items-center gap-1 px-3 py-2 text-sm text-[#52A8DE] hover:bg-[#52A8DE]/5 rounded-t transition-colors flex-shrink-0"
      >
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}
