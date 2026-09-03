import { useState } from 'react';
import { Fence } from 'lucide-react';
import { InaStavba } from '../../types/areal';
import { EntityTabBar } from '../ui/EntityTabBar';
import { Tooltip } from '../ui/Tooltip';
import { TextInput } from '../ui/TextInput';
import { NumberInput } from '../ui/NumberInput';

interface Step4Props {
  ineStavby: InaStavba[];
  addInaStavba: () => void;
  updateInaStavba: (index: number, data: Partial<InaStavba>) => void;
  removeInaStavba: (index: number) => void;
}

export function Step4_IneStavby({ ineStavby, addInaStavba, updateInaStavba, removeInaStavba }: Step4Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleRemove = (index: number) => {
    removeInaStavba(index);
    if (activeIndex >= ineStavby.length - 1 && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleAdd = () => {
    addInaStavba();
    setActiveIndex(ineStavby.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Fence className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Iné stavby</h2>
          <p className="text-xs text-gray-500">
            Oplotenie, chodníky, parkoviská, altánky bez stien a ďalšie stavby v areáli.
            Ak nemáte žiadne iné stavby, pokračujte ďalej.
          </p>
        </div>
      </div>

      {/* Deliaca čiara voči kroku Budovy: strecha a vnútorný priestor. */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700 flex items-start">
        <span>
          Sem patria stavby <strong>bez strechy alebo bez uzavretého vnútorného priestoru</strong> — oplotenie,
          chodník, terasa, parkovisko, altánok či pergola. Záhradnú chatku, domček na náradie a garáž zadajte
          medzi <strong>Budovy</strong> (krok 3) a označte ich tam ako sezónnu nevykurovanú stavbu.
        </span>
        <Tooltip glossaryKey="kamPatriStavbaDef" />
      </div>

      {ineStavby.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">Zatiaľ neboli pridané žiadne iné stavby.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 text-sm font-medium text-[#52A8DE] border border-[#52A8DE] rounded-xl hover:bg-[#52A8DE]/5 transition-colors"
          >
            Pridať inú stavbu
          </button>
        </div>
      ) : (
        <>
          <EntityTabBar
            items={ineStavby.map((s, i) => ({
              id: s.id,
              label: s.nazov || `Stavba ${i + 1}`,
            }))}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={handleAdd}
            onRemove={handleRemove}
            addLabel="Pridať stavbu"
            minItems={0}
          />
          {ineStavby[activeIndex] && (
            <InaStavbaForm
              stavba={ineStavby[activeIndex]}
              onChange={(data) => updateInaStavba(activeIndex, data)}
            />
          )}
        </>
      )}
    </div>
  );
}

function InaStavbaForm({ stavba, onChange }: { stavba: InaStavba; onChange: (data: Partial<InaStavba>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput
        label="Názov stavby"
        value={stavba.nazov}
        onChange={(v) => onChange({ nazov: v })}
        placeholder="napr. Oplotenie, Altánok"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput
          label="Parcela pod stavbou"
          value={stavba.parcela}
          onChange={(v) => onChange({ parcela: v })}
          tooltipKey="parcelaDef"
        />
        <TextInput
          label="Číslo listu vlastníctva"
          value={stavba.listVlastnictva}
          onChange={(v) => onChange({ listVlastnictva: v })}
          tooltipKey="listVlastnictvaDef"
        />
      </div>
      <TextInput
        label="Typ stavby"
        value={stavba.typStavby}
        onChange={(v) => onChange({ typStavby: v })}
        placeholder="napr. Oplotenie, Chodník, Parkovisko, Altán"
      />
      <TextInput
        label="Popis stavby"
        value={stavba.popisStavby}
        onChange={(v) => onChange({ popisStavby: v })}
        multiline
      />
      <TextInput
        label="Aktuálne využitie"
        value={stavba.aktualneVyuzitie}
        onChange={(v) => onChange({ aktualneVyuzitie: v })}
        placeholder="napr. oplotenie, chodník, parkovisko, altánok"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput
          label="Celková výmera parciel"
          value={stavba.celkovaVymeraParciel}
          onChange={(v) => onChange({ celkovaVymeraParciel: v })}
          unit="m²"
          tooltipText="Súčet výmier všetkých parciel podľa listu vlastníctva (LV)."
        />
        <NumberInput
          label="Zastavaná plocha"
          value={stavba.zastavanaPlocha}
          onChange={(v) => onChange({ zastavanaPlocha: v })}
          unit="m²"
          tooltipText="Plocha, ktorú stavba zaberá na zemi (pôdorys). Nájdete ju na stavebnom povolení alebo v katastri."
        />
      </div>
    </div>
  );
}
