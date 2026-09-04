import { useState } from 'react';
import { Trees } from 'lucide-react';
import { Pozemok } from '../../types/areal';
import { EntityTabBar } from '../ui/EntityTabBar';
import { PozemokForm } from './shared/PozemokForm';
import { formatArea } from '../../utils/formatters';

interface Step2Props {
  pozemky: Pozemok[];
  /** Zastavaná plocha stavieb z Kroku 4 — do výmer pozemku sa nezapočítava (#233). */
  plochaInychStavieb?: number;
  addPozemok: () => void;
  updatePozemok: (index: number, data: Partial<Pozemok>) => void;
  removePozemok: (index: number) => void;
}

export function Step2_Pozemky({
  pozemky, addPozemok, updatePozemok, removePozemok, plochaInychStavieb = 0,
}: Step2Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleRemove = (index: number) => {
    removePozemok(index);
    if (activeIndex >= pozemky.length - 1 && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleAdd = () => {
    addPozemok();
    setActiveIndex(pozemky.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-[#52A8DE]/10 rounded-xl flex items-center justify-center">
          <Trees className="w-5 h-5 text-[#52A8DE]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Pozemok</h2>
          <p className="text-xs text-gray-500">
            Posudzujeme iba nezastavanú časť pozemku. Zadajte údaje pre každú parcelu zvlášť.
          </p>
        </div>
      </div>

      {/* Nápoveda k rozhodnutiu, kam zaradiť parcelu (pozri issue #37). */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 space-y-1">
        <p><strong>Čo patrí sem (Pozemky):</strong> nezastavané parcely — trávnaté plochy, dvory, záhrady, spevnené plochy.</p>
        <p><strong>Čo do výmer nezapočítavajte:</strong> plochy stavieb zadaných v kroku <strong>Iné stavby</strong>
          — chodník, parkovisko, terasa či oplotenie. Do hodnotenia vstupujú odtiaľ, takže zadané dvakrát by areál
          zbytočne poškodili.</p>
        <p><strong>Čo patrí do Budov:</strong> parcely, na ktorých stojí budova — zadajte ich v kroku Budovy (pole Parcela).</p>
        <p><strong>Parcela len so stavbou</strong> patrí len medzi Budovy — nezadávajte ju medzi Pozemky.</p>
        <p><strong>Parcela s budovou aj nezastavaným pozemkom:</strong> zaraďte ju podľa toho, čo na nej prevažuje (dominantné využitie) — buď medzi Budovy, alebo medzi Pozemky.</p>
        <p><strong>Príklad:</strong> Škola má parcelu 100/1 (budova) a 100/2 (školský dvor). Do Pozemkov zadajte len 100/2.
          Ak je dvorová parcela rozdelená plotom na dve časti s rôznym povrchom, pridajte každú ako samostatnú kartu.</p>
      </div>

      {plochaInychStavieb > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
          V kroku Iné stavby máte zadaných <strong>{formatArea(plochaInychStavieb)}</strong>. Tie sa do
          hodnotenia pripočítajú ako nepriepustná plocha samy — vo výmerach nižšie ich nechajte nezapočítané.
        </div>
      )}

      <EntityTabBar
        items={pozemky.map((p, i) => ({
          id: p.id,
          label: p.aktualneVyuzitie || p.parcela || `Parcela ${i + 1}`,
        }))}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel="Pridať parcelu"
      />

      {pozemky[activeIndex] && (
        <PozemokForm
          pozemok={pozemky[activeIndex]}
          onChange={(data) => updatePozemok(activeIndex, data)}
        />
      )}
    </div>
  );
}
