import { useState } from 'react';
import { Home } from 'lucide-react';
import { Budova } from '../../types/areal';
import { EntityTabBar } from '../ui/EntityTabBar';
import { Tooltip } from '../ui/Tooltip';
import { BudovaForm } from './shared/BudovaForm';

interface Step3Props {
  budovy: Budova[];
  addBudova: () => void;
  updateBudova: (index: number, data: Partial<Budova>) => void;
  removeBudova: (index: number) => void;
  arealAdresa?: { adresa: string; obec: string };
  /** Verzia schémy načítanej relácie — zvýrazní nové nevyplnené polia (issue #177). */
  verziaRelacie?: number;
}

export function Step3_Budovy({ budovy, addBudova, updateBudova, removeBudova, arealAdresa, verziaRelacie }: Step3Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleRemove = (index: number) => {
    removeBudova(index);
    if (activeIndex >= budovy.length - 1 && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleAdd = () => {
    addBudova();
    setActiveIndex(budovy.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-[#2196F3]/10 rounded-xl flex items-center justify-center">
          <Home className="w-5 h-5 text-[#2196F3]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Budovy</h2>
          <p className="text-xs text-gray-500">
            Zadajte údaje pre každú budovu v areáli – strecha, voda, vykurovanie, energia.
          </p>
        </div>
      </div>

      {/* Nápoveda k rozhodnutiu, kam zaradiť parcelu (pozri issue #37). */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700 space-y-1">
        <p>Parcela, na ktorej je iba budova, patrí <strong>len sem (medzi Budovy)</strong> — nezadávajte ju medzi Pozemky.</p>
        <p>Ak je na parcele budova aj nezastavaný pozemok, zaraďte ju podľa toho, čo na nej prevažuje (dominantné využitie) — buď medzi Budovy, alebo medzi Pozemky.</p>
        <p className="flex items-start">
          <span>
            Sem patrí <strong>každý objekt so strechou a vnútorným priestorom</strong> — aj záhradná chatka,
            domček na náradie či garáž. Ak sa v nich nekúri, označte ich nižšie ako sezónnu nevykurovanú stavbu;
            strecha pre fotovoltiku, odvod vody a osvetlenie sa hodnotia aj tak.
          </span>
          <Tooltip glossaryKey="kamPatriStavbaDef" />
        </p>
      </div>

      <EntityTabBar
        items={budovy.map((b, i) => ({
          id: b.id,
          label: b.nazov || `Budova ${i + 1}`,
        }))}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
        onAdd={handleAdd}
        onRemove={handleRemove}
        addLabel="Pridať budovu"
      />

      {budovy[activeIndex] && (
        <BudovaForm
          budova={budovy[activeIndex]}
          onChange={(data) => updateBudova(activeIndex, data)}
          arealAdresa={arealAdresa}
          verziaRelacie={verziaRelacie}
        />
      )}
    </div>
  );
}
