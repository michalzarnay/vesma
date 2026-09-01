import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { BGOpatrenie } from '../../types/areal';
import { EntityTabBar } from '../ui/EntityTabBar';
import { TextInput } from '../ui/TextInput';
import { NumberInput } from '../ui/NumberInput';

interface Step5Props {
  bgOpatrenia: BGOpatrenie[];
  addBGOpatrenie: () => void;
  updateBGOpatrenie: (index: number, data: Partial<BGOpatrenie>) => void;
  removeBGOpatrenie: (index: number) => void;
}

export function Step5_BGOpatrenia({ bgOpatrenia, addBGOpatrenie, updateBGOpatrenie, removeBGOpatrenie }: Step5Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleRemove = (index: number) => {
    removeBGOpatrenie(index);
    if (activeIndex >= bgOpatrenia.length - 1 && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleAdd = () => {
    addBGOpatrenie();
    setActiveIndex(bgOpatrenia.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-[#52A8DE]/10 rounded-xl flex items-center justify-center">
          <Leaf className="w-5 h-5 text-[#52A8DE]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Zamýšľané B&G opatrenia</h2>
          <p className="text-xs text-gray-500">
            Opatrenia, ktoré plánujete realizovať a nemajú priamu súvislosť s konkrétnymi budovami – týkajú sa areálu ako celku.
          </p>
        </div>
      </div>

      {bgOpatrenia.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-4">Zatiaľ neboli pridané žiadne B&G opatrenia.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 text-sm font-medium text-[#52A8DE] border border-[#52A8DE] rounded-xl hover:bg-[#52A8DE]/5 transition-colors"
          >
            Pridať B&G opatrenie
          </button>
        </div>
      ) : (
        <>
          <EntityTabBar
            items={bgOpatrenia.map((o, i) => ({
              id: o.id,
              label: o.nazov || `Opatrenie ${i + 1}`,
            }))}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            onAdd={handleAdd}
            onRemove={handleRemove}
            addLabel="Pridať opatrenie"
            minItems={0}
          />
          {bgOpatrenia[activeIndex] && (
            <BGOpatrenieForm
              opatrenie={bgOpatrenia[activeIndex]}
              onChange={(data) => updateBGOpatrenie(activeIndex, data)}
            />
          )}
        </>
      )}
    </div>
  );
}

function BGOpatrenieForm({ opatrenie, onChange }: { opatrenie: BGOpatrenie; onChange: (data: Partial<BGOpatrenie>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput
        label="Názov B&G opatrenia"
        value={opatrenie.nazov}
        onChange={(v) => onChange({ nazov: v })}
        placeholder="napr. solárne panely, dažďová záhrada, zelené strechy"
        tooltipKey="BGOpatreniaDef"
      />
      <TextInput
        label="Na parcele"
        value={opatrenie.naParcele}
        onChange={(v) => onChange({ naParcele: v })}
        placeholder="napr. 2307, 2308/1"
      />
      <TextInput
        label="Susedná budova/pozemok mimo správy vlastníka riešeného areálu"
        value={opatrenie.inaBudovaMimoUSK}
        onChange={(v) => onChange({ inaBudovaMimoUSK: v })}
        multiline
        tooltipText="Uveďte, či sa v blízkosti nachádza susedný pozemok alebo budova vo vlastníctve iného subjektu (napr. obce, firmy, súkromnej osoby), ktorý by bol potrebný na realizáciu zamýšľaného B&G opatrenia."
      />
      <TextInput
        label="Ochranné pásma a technická infraštruktúra v okolí"
        value={opatrenie.ochrannePasma}
        onChange={(v) => onChange({ ochrannePasma: v })}
        multiline
        tooltipText="Uveďte, či sú v blízkosti plynovod, vodovod, elektrické vedenie alebo kanalizácia — môžu obmedziť výkopové práce pri realizácii opatrenia."
      />
      <TextInput
        label="Potenciál znečistenia"
        value={opatrenie.potencialZnecistenia}
        onChange={(v) => onChange({ potencialZnecistenia: v })}
        multiline
        tooltipText="Napr. z povrchového odtoku, ale aj skládky, staré environmentálne záťaže a pod."
      />
      <TextInput
        label="V akej hĺbke je hladina podzemnej vody"
        value={opatrenie.hladinaPodzemnejVody}
        onChange={(v) => onChange({ hladinaPodzemnejVody: v })}
        placeholder="napr. 5 m"
      />
      <NumberInput
        label="Vzdialenosť najbližšieho vodného toku"
        value={opatrenie.vzdialenostVodnehoToku}
        onChange={(v) => onChange({ vzdialenostVodnehoToku: v })}
        unit="m"
      />
      <TextInput
        label="Vplyv na ochranu pred povodňami"
        value={opatrenie.vplyvOchranaPredPovodniami}
        onChange={(v) => onChange({ vplyvOchranaPredPovodniami: v })}
        placeholder="áno/nie, príp. hodnota"
      />
      <TextInput
        label="Vplyv na zraniteľné skupiny obyvateľov"
        value={opatrenie.vplyvZranitelneSkupiny}
        onChange={(v) => onChange({ vplyvZranitelneSkupiny: v })}
        multiline
        tooltipText="Seniori, deti, zdravotne znevýhodnení a pod. v blízkosti."
      />
      <TextInput
        label="Prekážky pre vybudovanie opatrenia"
        value={opatrenie.prekazky}
        onChange={(v) => onChange({ prekazky: v })}
        multiline
        tooltipText="Uveďte prekážky, ak nejaké sú."
      />
    </div>
  );
}
