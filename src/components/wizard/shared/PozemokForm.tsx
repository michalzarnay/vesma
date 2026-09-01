import { Pozemok } from '../../../types/areal';
import { TextInput } from '../../ui/TextInput';
import { NumberInput } from '../../ui/NumberInput';
import { SelectCard } from '../../ui/SelectCard';
import { PercentageGroup } from '../../ui/PercentageGroup';
import { ConditionalSection } from '../../ui/ConditionalSection';
import { YES_NO } from '../../../data/constants';
import { PDFUploadButton } from '../../ui/PDFUploadButton';
import { ParsedDocument } from '../../../utils/pdfParser';

interface PozemokFormProps {
  pozemok: Pozemok;
  onChange: (data: Partial<Pozemok>) => void;
}

function applyLVToPozemok(doc: ParsedDocument, onChange: (data: Partial<Pozemok>) => void) {
  if (!doc.lv) return;
  const { lv } = doc;
  const updates: Partial<Pozemok> = {};
  if (lv.cisloLV) updates.listVlastnictva = lv.cisloLV;
  if (lv.parcely.length > 0) {
    updates.parcela = lv.parcely.map(p => p.cislo).join(', ');
  }
  onChange(updates);
}

export function PozemokForm({ pozemok, onChange }: PozemokFormProps) {
  return (
    <div className="space-y-6">
      {/* Identifikacia */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="text-sm font-semibold text-gray-800">Identifikácia</h3>
          <PDFUploadButton
            label="Nahrať list vlastníctva"
            acceptTypes={['lv']}
            onParsed={(doc) => applyLVToPozemok(doc, onChange)}
          />
        </div>
        <TextInput
          label="Aktuálne využitie"
          value={pozemok.aktualneVyuzitie}
          onChange={(v) => onChange({ aktualneVyuzitie: v })}
          placeholder="napr. záhrada, park, parkovisko, dvor"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label="Parcela"
            value={pozemok.parcela}
            onChange={(v) => onChange({ parcela: v })}
            placeholder="napr. 2307"
            tooltipKey="parcelaDef"
          />
          <TextInput
            label="Číslo listu vlastníctva"
            value={pozemok.listVlastnictva}
            onChange={(v) => onChange({ listVlastnictva: v })}
            placeholder="napr. 2794"
            tooltipKey="listVlastnictvaDef"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label="Celková výmera parcely"
            value={pozemok.celkovaVymera}
            onChange={(v) => onChange({ celkovaVymera: v })}
            unit="m²"
            tooltipText="Celková výmera parcely podľa katastra (vrátane plochy pod budovami, ak sú na parcele)."
          />
          <NumberInput
            label="Plocha bez budov (nezastavaná)"
            value={pozemok.plochaBezBudov}
            onChange={(v) => onChange({ plochaBezBudov: v })}
            unit="m²"
            tooltipText="Plocha parcely bez zastavanej časti – teda plocha pozemku, na ktorej nestojí žiadna budova. Táto plocha sa hodnotí v tomto formulári."
          />
        </div>
        {/* Nápoveda k rozhodnutiu, kam zaradiť parcelu (pozri issue #37). */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700 space-y-1">
          <p>Pozor: pozemok (parcela) <strong>nezahŕňa</strong> zastavanú plochu budov. Údaje o budovách zadajte v kroku Budovy.</p>
          <p>Parcela len so stavbou sem <strong>nepatrí</strong> — zadajte ju len medzi Budovy. Ak je na parcele budova aj nezastavaný pozemok, zaraďte ju tam, kde prevažuje dominantné využitie.</p>
        </div>
        <TextInput
          label="Členitosť terénu"
          value={pozemok.clenitosTerenu}
          onChange={(v) => onChange({ clenitosTerenu: v })}
          placeholder="napr. rovinatý, mierny svah, kopcovitý"
          tooltipText="Rovinatý (do 3 %), mierny svah (3–15 %), strmý svah (nad 15 %). Terén ovplyvňuje, kam odteká dažďová voda."
        />
      </div>

      {/* Odvod vody — 7 kategórií */}
      <PercentageGroup
        title="Odvod vody z pozemku"
        tooltipText="Kam odteká voda (zrejme najmä dažďová) z vášho pozemku? Rozdeľte 100% plochy medzi jednotlivé spôsoby odvodu."
        fields={[
          { key: 'odvodVodyJednotnaKanalizacia', label: 'jednotná stokova sieť', tooltipText: 'Kanalizácia spoločná pre splaškovú aj dažďovú vodu.' },
          { key: 'odvodVodySplaskovaKanalizacia', label: 'delená splašková kanalizácia (omylom zvedené zrážky)', tooltipText: 'Samostatná splašková kanalizácia určená len pre splašky – sem uveďte podiel plochy, z ktorej sú zrážky omylom zvedené do splaškovej kanalizácie (hoci tam nepatria).' },
          { key: 'odvodVodyZrazkovaKanalizacia', label: 'delená zrážková kanalizácia', tooltipText: 'Samostatná kanalizácia len pre dažďovú vodu.' },
          { key: 'odvodVodyVodnyTok', label: 'do vodného toku', tooltipText: 'Priamo do potoka, rieky alebo vodnej plochy.' },
          { key: 'odvodVodyVsakovanie', label: 'cielené vsakovanie', tooltipText: 'Cielene vsakovaním – napr. do priehlbne, dažďovej záhrady.' },
          { key: 'odvodVodyRetencnaNadrzou', label: 'do retenčnej nádrže', tooltipText: 'Voda zo striech alebo plôch sa zachytáva v zásobníku (napr. podzemná betónová nádrž, plastový kontajner) a neskôr využíva na závlahu alebo úžitkovú vodu.' },
          { key: 'odvodVodyNerieseny', label: 'neriešený', tooltipText: 'Odvod vody nie je riešený – voda voľne steká po povrchu.' },
        ]}
        values={{
          odvodVodyJednotnaKanalizacia: pozemok.odvodVodyJednotnaKanalizacia,
          odvodVodySplaskovaKanalizacia: pozemok.odvodVodySplaskovaKanalizacia,
          odvodVodyZrazkovaKanalizacia: pozemok.odvodVodyZrazkovaKanalizacia,
          odvodVodyVodnyTok: pozemok.odvodVodyVodnyTok,
          odvodVodyVsakovanie: pozemok.odvodVodyVsakovanie,
          odvodVodyRetencnaNadrzou: pozemok.odvodVodyRetencnaNadrzou,
          odvodVodyNerieseny: pozemok.odvodVodyNerieseny,
        }}
        onChange={(key, value) => onChange({ [key]: value })}
      />

      {/* Prirodny (vsakovaci) povrch */}
      <div className="space-y-4">
        <NumberInput
          label="Prírodný (vsakovací) povrch celkom"
          value={pozemok.priepustnaPlochaCelkom}
          onChange={(v) => onChange({ priepustnaPlochaCelkom: v })}
          unit="m²"
          tooltipKey="priepustnaPlochaDef"
        />
        <ConditionalSection title="Rozdelenie prírodného (vsakovacieho) povrchu" show={pozemok.priepustnaPlochaCelkom > 0}>
          <PercentageGroup
            title="Podiel typov vegetácie na prírodnom (vsakovacom) povrchu"
            tooltipText="Rozdeľte prírodný (vsakovací) povrch podľa typu vegetácie. Súčet musí byť 100%."
            fields={[
              { key: 'priepustnaPlochaByliny', label: 'byliny (trávnik, lúka, príp. holá pôda dočasne)' },
              { key: 'priepustnaPlochaKry', label: 'kry' },
              { key: 'priepustnaPlochaStromy', label: 'stromy' },
            ]}
            values={{
              priepustnaPlochaByliny: pozemok.priepustnaPlochaByliny,
              priepustnaPlochaKry: pozemok.priepustnaPlochaKry,
              priepustnaPlochaStromy: pozemok.priepustnaPlochaStromy,
            }}
            onChange={(key, value) => onChange({ [key]: value })}
          />
          <div className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">
            Časť zatienená drevinami (súčet stromov a krov):{' '}
            <span className="font-medium">
              {Math.round(pozemok.priepustnaPlochaKry + pozemok.priepustnaPlochaStromy)} %
            </span>
          </div>
        </ConditionalSection>
      </div>

      {/* Spevneny (polopriepustny) povrch */}
      <div className="space-y-4">
        <NumberInput
          label="Spevnený (polopriepustný) povrch celkom"
          value={pozemok.polopriepustnaPlochaCelkom}
          onChange={(v) => onChange({ polopriepustnaPlochaCelkom: v })}
          unit="m²"
          tooltipKey="polopriepustnaPlochaDef"
        />
        <ConditionalSection title="Rozdelenie spevneného (polopriepustného) povrchu" show={pozemok.polopriepustnaPlochaCelkom > 0}>
          <PercentageGroup
            title="Typy spevneného (polopriepustného) povrchu"
            tooltipText="Rozdeľte spevnený (polopriepustný) povrch podľa typu materiálu. Súčet musí byť 100%."
            fields={[
              { key: 'polopriepustnaPriepustnyAsfalt', label: 'priepustný asfalt' },
              { key: 'polopriepustnaPriepustnyBeton', label: 'priepustný betón' },
              { key: 'polopriepustnaPlnevegetacneTvarnice', label: 'plnevegetačné zatrávňovacie tvárnice' },
              { key: 'polopriepustnaPolovegetacneTvarnice', label: 'polovegetačné tvárnice (betónové)' },
              { key: 'polopriepustnaVodopriepustnaDlazba', label: 'vodopriepustná dlažba', tooltipKey: 'priepustnaDlazbaDef' },
              { key: 'polopriepustnaZivicaKremicityStrk', label: 'živica a kremičitý štrk' },
              { key: 'polopriepustnaMlatovyPovrch', label: 'mlatový povrch' },
              {
                key: 'polopriepustnaStered',
                label: 'geomreža / priepustná dlažba (napr. STERED, Aquadesk)',
                tooltipText: 'Priepustná plastová dlažba alebo geomreža umožňuje vsakovanie dažďovej vody. Komerčné názvy: STERED, Aquadesk a pod.',
              },
              { key: 'polopriepustnaInyPovrch', label: 'iný povrch' },
            ]}
            values={{
              polopriepustnaPriepustnyAsfalt: pozemok.polopriepustnaPriepustnyAsfalt,
              polopriepustnaPriepustnyBeton: pozemok.polopriepustnaPriepustnyBeton,
              polopriepustnaPlnevegetacneTvarnice: pozemok.polopriepustnaPlnevegetacneTvarnice,
              polopriepustnaPolovegetacneTvarnice: pozemok.polopriepustnaPolovegetacneTvarnice,
              polopriepustnaVodopriepustnaDlazba: pozemok.polopriepustnaVodopriepustnaDlazba,
              polopriepustnaZivicaKremicityStrk: pozemok.polopriepustnaZivicaKremicityStrk,
              polopriepustnaMlatovyPovrch: pozemok.polopriepustnaMlatovyPovrch,
              polopriepustnaStered: pozemok.polopriepustnaStered,
              polopriepustnaInyPovrch: pozemok.polopriepustnaInyPovrch,
            }}
            onChange={(key, value) => onChange({ [key]: value })}
          />
          <NumberInput
            label="Časť spevneného (polopriepustného) povrchu vyspádovaná"
            value={pozemok.polopriepustnaVyspadovana}
            onChange={(v) => onChange({ polopriepustnaVyspadovana: v })}
            unit="%" max={100}
            tooltipKey="vyspadovanyPozemokDef"
          />
        </ConditionalSection>
      </div>

      {/* Nepriepustny povrch */}
      <div className="space-y-4">
        <NumberInput
          label="Nepriepustný povrch celkom"
          value={pozemok.spevnenaPlochaCelkom}
          onChange={(v) => onChange({ spevnenaPlochaCelkom: v })}
          unit="m²"
          tooltipKey="spevnenaPlochaDef"
        />
        <ConditionalSection title="Detail nepriepustného povrchu" show={pozemok.spevnenaPlochaCelkom > 0}>
          <NumberInput
            label="Časť nepriepustného povrchu vyspádovaná"
            value={pozemok.spevnenaPlochaVyspadovana}
            onChange={(v) => onChange({ spevnenaPlochaVyspadovana: v })}
            unit="%" max={100}
            tooltipKey="vyspadovanyPozemokDef"
          />
        </ConditionalSection>
      </div>

      {/* Stromy */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">Stromy</h3>
        <p className="text-xs text-gray-500">
          Do plochy stromov započítajte aj stromy z parciel susediacich s riešenou parcelou, ak ich koruny presahujú
          cez hranicu na túto parcelu a majú adaptačný význam pre ňu. Zvlášť v prípade, že ide o susedné parcely
          mimo posudzovaného areálu.
        </p>
        {pozemok.priepustnaPlochaStromy > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label="Podiel mladých stromov"
              value={pozemok.stromyPodielMladych}
              onChange={(v) => onChange({ stromyPodielMladych: v })}
              unit="%" max={100}
              tooltipText="Koľko percent všetkých stromov sú mladé (menej ako 10–15 rokov)."
            />
            <NumberInput
              label="Podiel poškodených stromov"
              value={pozemok.stromyPodielNezdravych}
              onChange={(v) => onChange({ stromyPodielNezdravych: v })}
              unit="%" max={100}
              tooltipText="Koľko percent stromov je poškodených, chorých alebo odumierajúcich."
            />
          </div>
        )}
        {pozemok.priepustnaPlochaStromy === 0 && (
          <p className="text-xs text-gray-400 italic">
            Polia pre stromy sú dostupné, keď je podiel stromov na priepustnej ploche väčší ako 0 %.
          </p>
        )}
      </div>

      {/* Existujuca infrastruktura */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">
          Už zrealizovaná infraštruktúra na pozemkoch
        </h3>

        {/* Dažďová záhrada */}
        <div className="space-y-3 border border-gray-100 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-gray-700">Dažďová záhrada</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumberInput label="Plocha" value={pozemok.dazdovaZahradaPlocha}
              onChange={(v) => onChange({ dazdovaZahradaPlocha: v })} unit="m²" tooltipKey="dazdovaZahradaDef" />
            <NumberInput label="Hĺbka" value={pozemok.dazdovaZahradaHlbka}
              onChange={(v) => onChange({ dazdovaZahradaHlbka: v })} unit="cm" />
            <NumberInput label="Odvodnená plocha strechy" value={pozemok.dazdovaZahradaPlochaStrechy}
              onChange={(v) => onChange({ dazdovaZahradaPlochaStrechy: v })} unit="m²"
              tooltipText="Plocha strechy, z ktorej voda odteká do dažďovej záhrady." />
            <NumberInput label="Odvodnená plocha terénu" value={pozemok.dazdovaZahradaPlochaTerenu}
              onChange={(v) => onChange({ dazdovaZahradaPlochaTerenu: v })} unit="m²"
              tooltipText="Plocha terénu, z ktorej voda odteká do dažďovej záhrady." />
          </div>
        </div>

        {/* Jazierko */}
        <div className="space-y-3 border border-gray-100 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-gray-700">Jazierko</h4>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Plocha" value={pozemok.jazierkoPlocha}
              onChange={(v) => onChange({ jazierkoPlocha: v })} unit="m²" />
            <NumberInput label="Max. hĺbka" value={pozemok.jazierkoHlbka}
              onChange={(v) => onChange({ jazierkoHlbka: v })} unit="cm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectCard label="Bezpečnostný prepad riešený" options={YES_NO}
              value={pozemok.jazierkoPrepadRieseny}
              onChange={(v) => onChange({ jazierkoPrepadRieseny: v as 0 | 1 })} />
            <ConditionalSection title="" show={pozemok.jazierkoPrepadRieseny === 1} defaultOpen>
              <TextInput label="Kam smeruje prepad" value={pozemok.jazierkoSmerPrepadu}
                onChange={(v) => onChange({ jazierkoSmerPrepadu: v })}
                placeholder="napr. do kanalizácie, na terén" />
            </ConditionalSection>
          </div>
        </div>

        {/* Nádrže */}
        <div className="space-y-3 border border-gray-100 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-gray-700">Nádrže na dažďovú vodu</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberInput label="Nadzemné nádrže – objem" value={pozemok.nadzemneNadobyObjem}
              onChange={(v) => onChange({ nadzemneNadobyObjem: v })} unit="m³"
              step="any" placeholder="0,0"
              tooltipText="Celkový objem všetkých nádob na dažďovú vodu v m³. Príklad: 2 sudy po 200 l = 0,4 m³." />
            <NumberInput label="Podzemné nádrže – objem" value={pozemok.podzemneNadobyObjem}
              onChange={(v) => onChange({ podzemneNadobyObjem: v })} unit="m³"
              step="any" placeholder="0,0"
              tooltipText="Objem uveďte v m³, možno aj desatinné číslo (napr. 0.4)." />
          </div>
          <TextInput label="Spôsob využitia vody z nádob" value={pozemok.sposobVyuzitiaVody}
            onChange={(v) => onChange({ sposobVyuzitiaVody: v })}
            placeholder="napr. polievanie, sekundárny okruh" />
          <SelectCard label="Kapacita nádrží postačuje na zachytenie zrážok zo strechy?"
            options={YES_NO} value={pozemok.kapacitaNadrzSebahodnotenie}
            onChange={(v) => onChange({ kapacitaNadrzSebahodnotenie: v as 0 | 1 })} />
        </div>

        {/* Zelená strecha na pozemkoch */}
        <div className="space-y-3 border border-gray-100 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-gray-700">Vegetačná strecha na doplnkových stavbách na pozemku (napr. prístrešok, altánok a pod.)</h4>
          <NumberInput label="Celková plocha" value={pozemok.zelenaStrechaPlocha}
            onChange={(v) => onChange({ zelenaStrechaPlocha: v })} unit="m²" tooltipKey="zelenaStrechaDef" />
          <ConditionalSection title="Rozdelenie podľa typu" show={pozemok.zelenaStrechaPlocha > 0}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <NumberInput label="Extenzívna plochá (sklon ≤35°, substrát ≤200mm)" value={pozemok.zelenaStrechaExtenzivnaPloca}
                onChange={(v) => onChange({ zelenaStrechaExtenzivnaPloca: v })} unit="m²" />
              <NumberInput label="Extenzívna šikmá (sklon >35°)" value={pozemok.zelenaStrechaExtenzivnaSikma}
                onChange={(v) => onChange({ zelenaStrechaExtenzivnaSikma: v })} unit="m²" />
              <NumberInput label="Intenzívna (substrát >200mm)" value={pozemok.zelenaStrechaIntenzivna}
                onChange={(v) => onChange({ zelenaStrechaIntenzivna: v })} unit="m²" />
              <NumberInput label="Modrá / modrozelená" value={pozemok.zelenaStrechaModrozelena}
                onChange={(v) => onChange({ zelenaStrechaModrozelena: v })} unit="m²" />
              <NumberInput label="So štrkovým zásypom" value={pozemok.zelenaStrechaStrkova}
                onChange={(v) => onChange({ zelenaStrechaStrkova: v })} unit="m²" />
              <NumberInput label="Zelená stena / popínavé rastliny" value={pozemok.zelenaStenaNaPozemku}
                onChange={(v) => onChange({ zelenaStenaNaPozemku: v })} unit="m²" />
            </div>
          </ConditionalSection>
        </div>

        {/* Vsakovacie priehlbne */}
        <div className="space-y-3 border border-gray-100 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-gray-700">Vsakovacie priehlbne</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberInput label="S bezpečnostným prepadom" value={pozemok.vsakovaciaPrehlbenaBezpecnostnyPrepad}
              onChange={(v) => onChange({ vsakovaciaPrehlbenaBezpecnostnyPrepad: v })} unit="m²" />
            <NumberInput label="S regulovaným odtokom" value={pozemok.vsakovaciaPrehlbenaRegulovanyOdtok}
              onChange={(v) => onChange({ vsakovaciaPrehlbenaRegulovanyOdtok: v })} unit="m²" />
          </div>
        </div>

        {/* Prekoreniteľný priestor */}
        <NumberInput
          label="Podzemný prekoreniteľný priestor pre stromy"
          value={pozemok.prekorenetelnyPriestorPreStromy}
          onChange={(v) => onChange({ prekorenetelnyPriestorPreStromy: v })}
          unit="m²"
          tooltipText="Špeciálne upravený podzemný priestor, ktorý umožňuje koreňom stromov rásť pod spevnenými plochami."
        />
      </div>
    </div>
  );
}
