import { Check } from 'lucide-react';

interface SelectionMarkProps {
  selected: boolean;
  /** radio = kruh s bodkou (jedna možnosť z viacerých), checkbox = štvorec s fajkou (viac možností) */
  kind?: 'radio' | 'checkbox';
}

/**
 * Tvarový indikátor výberu, ktorý nezávisí od farby: prázdny kruh/štvorec vs.
 * vyplnený s bodkou/fajkou. Čisto vizuálny (aria-hidden) — stav nesie
 * aria-pressed / aria-current na rodičovskom prvku.
 */
export function SelectionMark({ selected, kind = 'radio' }: SelectionMarkProps) {
  const shape = kind === 'radio' ? 'rounded-full' : 'rounded';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center flex-shrink-0 w-4 h-4 border-2 ${shape}
        ${selected ? 'border-[#52A8DE] bg-[#52A8DE]' : 'border-gray-400 bg-white'}`}
    >
      {selected && (kind === 'radio'
        ? <span className="block w-1.5 h-1.5 rounded-full bg-white" />
        : <Check className="w-3 h-3 text-white" strokeWidth={3} />)}
    </span>
  );
}
