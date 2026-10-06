import { BarChart3, Download, FileText, ChevronDown, ChevronRight, TableProperties, Settings2, Info } from 'lucide-react';
import { useState } from 'react';
import { Areal, ScoringWeights } from '../../types/areal';
import { useScoring } from '../../hooks/useScoring';
import { useRecommendations } from '../../hooks/useRecommendations';
import { ScoreGauge } from '../ui/ScoreGauge';
import { EnergiaScore, getScoreLevel } from '../../types/scoring';
import { Odporucanie } from '../../types/catalog';
import { exportToXlsx } from '../../utils/xlsxExport';
import { csvExportu } from '../../utils/csvExport';
import { csvFilename, pdfFilename } from '../../utils/exportFilenames';
import { exportVysledkovDoPdf } from '../../utils/pdfExport';
import { computeArealEnPI, ArealEnPI } from '../../utils/energyIndicators';
import { VysvetlenieKomponentu } from '../../utils/skoreVysvetlenie';
import {
  NAZOV_OBLASTI_DLHY, NAZOV_OBLASTI_KRATKY, SKRATKY, ScoreDetailItem, VYSVETLENIE_OZE_BEZ_BUDOV,
  fmtNum, kartyDetailuSkore, skupinyPrehladu, textVah, vysvetlenieEnergetikaNehodnotena, zakladVysledkov,
} from '../../utils/vysledkyPrehlad';
import { CopyButton } from '../ui/CopyButton';
import { VypocetDialog } from './VypocetDialog';
import { UPOZORNENIE_ROZSAH_HODNOTENIA } from '../../data/constants';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer,
} from 'recharts';

interface Step6Props {
  areal: Areal;
  updateVahy?: (vahy: Partial<ScoringWeights>) => void;
}


export function Step6_Vysledky({ areal, updateVahy }: Step6Props) {
  const score = useScoring(areal);
  const recommendations = useRecommendations(areal);
  const enpi = computeArealEnPI(areal);
  const [vahyOpen, setVahyOpen] = useState(false);
  const [vypocet, setVypocet] = useState<VysvetlenieKomponentu | null>(null);

  // Čo sa vo Výsledkoch ukazuje a hodnotí, skladá `zakladVysledkov()` — rovnako
  // ako pre PDF, aby sa karta a export nemohli rozísť.
  const zaklad = zakladVysledkov(areal, score);
  const {
    ukazVodu, ukazEnergiu, hodnotiOZE, hodnotiEnergetiku, oblastiVah, vazeneSkore, radar: radarData,
  } = zaklad;
  const karty = kartyDetailuSkore(areal, score);
  const textVahy = textVah(areal.vahy, zaklad);

  const handleExportCSV = () => {
    // CSV nesie to isté, čo zošit — obsah skladá `csvExportu()` z rovnakých
    // hárkov, aby sa oba exporty nemohli rozísť (#209, #223).
    const csv = csvExportu(areal, score, recommendations);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFilename(areal.nazov);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    exportToXlsx(areal, score, recommendations);
  };

  const handleExportPDF = async () => {
    try {
      await exportVysledkovDoPdf(areal, score, recommendations, pdfFilename(areal.nazov));
    } catch (e) {
      alert(`PDF sa nepodarilo vytvoriť: ${e instanceof Error ? e.message : 'neznáma chyba'}`);
    }
  };

  const handleExportXmatik = () => {
    alert('Integrácia s Xmatik (ŽSK) bude implementovaná po poskytnutí špecifikácie API/formátu exportu.');
  };

  const handleExportURBIS = () => {
    alert('Integrácia s URBIS (model majetku obcí) bude implementovaná po poskytnutí špecifikácie exportného formátu.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-[#52A8DE]/10 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#52A8DE]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Výsledky hodnotenia</h2>
          <p className="text-xs text-gray-500">
            {areal.nazov && `${areal.nazov} – `}Celkové skóre a odporúčané opatrenia
          </p>
        </div>
      </div>

      {/* Legenda skratiek */}
      <details className="group border border-gray-200 rounded-xl overflow-hidden">
        <summary className="cursor-pointer flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-600 list-none select-none">
          <span className="group-open:rotate-90 transition-transform inline-block text-gray-400">▶</span>
          Vysvetlenie skratiek
        </summary>
        <div className="px-4 pb-3 pt-2 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-gray-600">
          {SKRATKY.map((s) => (
            <div key={s.skratka}><abbr title={s.title} className="no-underline font-semibold">{s.skratka}</abbr> – {s.popis}</div>
          ))}
        </div>
      </details>

      {/* Score Gauges */}
      <div className="flex flex-wrap justify-center gap-8">
        <div className="text-center">
          <ScoreGauge score={vazeneSkore} label="Celkové skóre (vážené)" size="lg" />
          {textVahy && <p className="text-xs text-gray-400 mt-1">{textVahy}</p>}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {ukazVodu && <ScoreGauge score={score.mzi.celkove} label={NAZOV_OBLASTI_DLHY.mzi} size="md" />}
        {ukazEnergiu && (hodnotiOZE
          ? <ScoreGauge score={score.oze.celkove} label={NAZOV_OBLASTI_DLHY.oze} size="md" />
          : <OblastNehodnotena nazov={NAZOV_OBLASTI_DLHY.oze} vysvetlenie={VYSVETLENIE_OZE_BEZ_BUDOV} />)}
        {ukazEnergiu && (hodnotiEnergetiku
          ? <ScoreGauge score={score.energia.celkove} label={NAZOV_OBLASTI_DLHY.energia} size="md" />
          : <EnergetikaNehodnotena energia={score.energia} />)}
      </div>

      {/* Váhy nastavenie — len pre oblasti v rozsahu mapovania */}
      {updateVahy && oblastiVah.length > 1 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setVahyOpen(!vahyOpen)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <Settings2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Nastavenie váh pre porovnanie areálov</span>
            {vahyOpen ? <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" /> : <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />}
          </button>
          {vahyOpen && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
              <p className="text-xs text-gray-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-400" />
                Predvolená váha je 1 pre každú oblasť. Zvýšte váhu, ak chcete pri porovnávaní viacerých areálov v XLSX klásť väčší dôraz na danú oblasť (napr. MZI = 2 zdvojnásobí jej vplyv na vážené skóre).
              </p>
              <div className="grid grid-cols-3 gap-3">
                {oblastiVah.map((oblast) => (
                  <div key={oblast}>
                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                      {NAZOV_OBLASTI_KRATKY[oblast]}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={areal.vahy[oblast]}
                      onChange={(e) => updateVahy({ [oblast]: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-center focus:outline-none focus:border-[#52A8DE]"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">
                      {Math.round(score[oblast].celkove * areal.vahy[oblast])} / {Math.round(100 * areal.vahy[oblast])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Radar Chart — má zmysel až pri dvoch a viac oblastiach */}
      {radarData.length > 1 && (
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Porovnanie oblastí</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <Radar
                dataKey="value"
                stroke="#52A8DE"
                fill="#52A8DE"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Score Detail — mriežka má toľko stĺpcov, koľko je hodnotených oblastí,
          aby pri „iba voda" alebo „iba energia" nezostali dve tretiny šírky
          prázdne a vysvetlenia sa nelámali do úzkeho stĺpca (podnet 86). */}
      <div className={`grid grid-cols-1 gap-4 ${
        karty.length === 3 ? 'md:grid-cols-3' : karty.length === 2 ? 'md:grid-cols-2' : ''
      }`}>
        {karty.map((k) => (
          <ScoreDetail key={k.title} title={k.title} items={k.items} poznamka={k.poznamka} onZobrazVypocet={setVypocet} />
        ))}
      </div>

      {/* Energetické ukazovatele (EnPI) — issue #171 */}
      {ukazEnergiu && <EnergyIndicators enpi={enpi} />}

      {/* Čo bolo zadané v dotazníku — issues #209 a #223 */}
      <ZadaneEntity areal={areal} />

      {/* Médiá prehľad */}
      {areal.media.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            Priložené médiá ({areal.media.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {areal.media.map((m) => (
              <div key={m.id} className="flex items-center gap-1.5 text-xs bg-gray-100 rounded-full px-3 py-1 text-gray-600">
                {m.typ === 'foto' ? '📷' : '🎥'} {m.nazov}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Odporúčané opatrenia ({recommendations.length})
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Zadajte viac údajov o areáli, aby sme mohli vygenerovať odporúčania.
          </p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.opatrenie.id} rec={rec} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Export výsledkov</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#52A8DE] rounded-xl hover:bg-[#52A8DE]/90 transition-colors"
          >
            <TableProperties className="w-4 h-4" />
            Exportovať XLSX
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#52A8DE] border border-[#52A8DE] rounded-xl hover:bg-[#52A8DE]/5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Stiahnuť PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportovať CSV
          </button>
        </div>

        {/* Integrácie (stub) */}
        <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Integrácie (pripravené, čakajú na špecifikáciu)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportXmatik}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 rounded-xl hover:bg-blue-50 transition-colors opacity-70"
            >
              Xmatik (ŽSK) →
            </button>
            <button
              onClick={handleExportURBIS}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 border border-purple-300 rounded-xl hover:bg-purple-50 transition-colors opacity-70"
            >
              URBIS – model majetku →
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Export do externých systémov bude dostupný v budúcej verzii. Kontaktujte správcu VESMA.
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center italic">
        Toto hodnotenie je orientačné. Pre presný návrh kontaktujte odborníka.
      </p>
      <p className="text-xs text-gray-400 text-center italic">
        {UPOZORNENIE_ROZSAH_HODNOTENIA}
      </p>

      {vypocet && <VypocetDialog vysvetlenie={vypocet} onClose={() => setVypocet(null)} />}
    </div>
  );
}

/**
 * Ukazovatele energetickej hospodárnosti z NAMERANEJ spotreby (faktúry).
 * Vykurovanie a elektrina sa vedú oddelene (pole „spotreba elektriny" môže zahŕňať
 * aj elektrinu na vykurovanie). Nejde o vypočítanú potrebu z energetického certifikátu.
 */
function EnergyIndicators({ enpi }: { enpi: ArealEnPI }) {
  const budovySoSpotrebou = enpi.budovy.filter(
    ({ enpi: e }) => e.spotrebaVykurovanie > 0 || e.spotrebaElektrina > 0,
  );
  if (budovySoSpotrebou.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">
        Energetické ukazovatele – nameraná spotreba
        {enpi.roky.length > 0 && <span className="font-normal text-gray-500"> (rok {enpi.roky.join(', ')})</span>}
      </h3>
      <div className="overflow-x-auto bg-gray-50 rounded-xl p-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-1.5 pr-3 font-medium">Budova</th>
              <th className="py-1.5 px-3 font-medium text-right">Vykurovanie<br /><span className="font-normal">kWh/rok</span></th>
              <th className="py-1.5 px-3 font-medium text-right">Merná spotreba<br /><span className="font-normal">kWh/(m²·rok)</span></th>
              <th className="py-1.5 px-3 font-medium text-right">Na hodinu prev.<br /><span className="font-normal">kWh/h</span></th>
              <th className="py-1.5 px-3 font-medium text-right">Elektrina<br /><span className="font-normal">kWh/rok</span></th>
              <th className="py-1.5 px-3 font-medium text-right">Merná spotreba<br /><span className="font-normal">kWh/(m²·rok)</span></th>
              <th className="py-1.5 pl-3 font-medium text-right">Na hodinu prev.<br /><span className="font-normal">kWh/h</span></th>
            </tr>
          </thead>
          <tbody>
            {budovySoSpotrebou.map(({ budova, enpi: e }, i) => (
              <tr key={budova.id} className="border-b border-gray-100 text-gray-700">
                <td className="py-1.5 pr-3 font-medium">{budova.nazov || `Budova ${i + 1}`}</td>
                <td className="py-1.5 px-3 text-right">{fmtNum(e.spotrebaVykurovanie > 0 ? e.spotrebaVykurovanie : undefined)}</td>
                <td className="py-1.5 px-3 text-right">{fmtNum(e.mernaSpotrebaVykurovanie)}</td>
                <td className="py-1.5 px-3 text-right">{fmtNum(e.vykurovanieNaHodinu, 1)}</td>
                <td className="py-1.5 px-3 text-right">{fmtNum(e.spotrebaElektrina > 0 ? e.spotrebaElektrina : undefined)}</td>
                <td className="py-1.5 px-3 text-right">{fmtNum(e.mernaSpotrebaElektrina)}</td>
                <td className="py-1.5 pl-3 text-right">{fmtNum(e.elektrinaNaHodinu, 1)}</td>
              </tr>
            ))}
            <tr className="font-semibold text-gray-800">
              <td className="py-1.5 pr-3">Areál spolu</td>
              <td className="py-1.5 px-3 text-right">{fmtNum(enpi.spotrebaVykurovanie > 0 ? enpi.spotrebaVykurovanie : undefined)}</td>
              <td className="py-1.5 px-3 text-right">{fmtNum(enpi.mernaSpotrebaVykurovanie)}</td>
              <td className="py-1.5 px-3 text-right">–</td>
              <td className="py-1.5 px-3 text-right">{fmtNum(enpi.spotrebaElektrina > 0 ? enpi.spotrebaElektrina : undefined)}</td>
              <td className="py-1.5 px-3 text-right">{fmtNum(enpi.mernaSpotrebaElektrina)}</td>
              <td className="py-1.5 pl-3 text-right">–</td>
            </tr>
          </tbody>
        </table>
        {enpi.pocetOsob > 0 && (
          <p className="text-xs text-gray-700 mt-3">
            Na osobu ({fmtNum(enpi.pocetOsob)} osôb – zamestnanci a klienti/žiaci podľa kapacity a obsadenosti):
            vykurovanie <span className="font-medium">{fmtNum(enpi.vykurovanieNaOsobu)} kWh/os·rok</span>,
            elektrina <span className="font-medium">{fmtNum(enpi.elektrinaNaOsobu)} kWh/os·rok</span>.
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Merná spotreba na vykurovanie je vztiahnutá na vykurovanú plochu, merná spotreba elektriny na úžitkovú plochu.
        Ide o nameranú spotrebu z faktúr, bez klimatickej normalizácie – nezamieňať s vypočítanou potrebou energie
        z energetického certifikátu.
      </p>
    </div>
  );
}

/**
 * Prehľad toho, čo bolo zadané v dotazníku (issues #209 a #223).
 *
 * „Iné stavby" a opatrenia pre MZI sa predtým nedostali ani sem, ani do exportu —
 * používateľ ich vyplnil a vo výstupe po nich nezostala stopa. Skóre menia
 * len tie skupiny, ktoré doň vstupujú; pri ostatných to prehľad povie rovno,
 * aby si nikto nemyslel, že altánok zlepšil hodnotenie.
 */
function ZadaneEntity({ areal }: { areal: Areal }) {
  const skupiny = skupinyPrehladu(areal).filter((s) => s.polozky.length > 0);
  if (skupiny.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">Zadané v dotazníku</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skupiny.map((skupina) => (
          <div key={skupina.nadpis} className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {skupina.nadpis} ({skupina.polozky.length})
              <span className="ml-1.5 font-normal text-gray-400">krok {skupina.krok}</span>
            </h4>
            <ul className="space-y-1">
              {skupina.polozky.map((p) => (
                <li key={p.id} className="text-xs text-gray-700">
                  <span className="font-medium">{p.nazov}</span>
                  {p.popis && <span className="text-gray-500"> — {p.popis}</span>}
                </li>
              ))}
            </ul>
            {skupina.mimoSkore && (
              <p className="text-[11px] text-gray-400 leading-snug">{skupina.mimoSkore}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Namiesto ukazovateľa energetickej efektívnosti, keď sa energetika nehodnotí —
 * všetky budovy areálu sú sezónne nevykurované stavby. Nula by sa tu čítala ako
 * „veľký priestor na zlepšenie", hoci zlepšovať nie je čo.
 */
function OblastNehodnotena({ nazov, vysvetlenie }: { nazov: string; vysvetlenie: React.ReactNode }) {
  return (
    <div className="max-w-xs rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
      <p className="text-sm font-medium text-gray-700">{nazov}</p>
      <p className="mt-1 text-sm text-gray-500">nehodnotí sa</p>
      <p className="mt-2 text-xs text-gray-500">{vysvetlenie}</p>
    </div>
  );
}

function EnergetikaNehodnotena({ energia }: { energia: EnergiaScore }) {
  return <OblastNehodnotena nazov={NAZOV_OBLASTI_DLHY.energia} vysvetlenie={vysvetlenieEnergetikaNehodnotena(energia)} />;
}

function ScoreDetail({ title, items, poznamka, onZobrazVypocet }: {
  title: string;
  items: ScoreDetailItem[];
  poznamka?: string;
  onZobrazVypocet?: (vysvetlenie: VysvetlenieKomponentu) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      {items.map((item) => {
        const podiel = item.score === null ? 0 : item.score / item.max;
        return (
          <div key={item.label} className="space-y-1 pb-1">
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-gray-600">{item.label}</span>
              {item.score === null ? (
                <span className="text-gray-400 italic whitespace-nowrap">
                  {item.dovodNehodnotenia ? 'nehodnotí sa' : 'bez údajov'}
                </span>
              ) : (
                <span className="font-medium whitespace-nowrap">
                  {item.hodnota && <span className="text-gray-400 font-normal mr-1.5">{item.hodnota}</span>}
                  {item.score}/{item.max}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${podiel * 100}%`,
                  backgroundColor: getScoreLevel(podiel * 100).color,
                }}
              />
            </div>
            {item.score === null && (item.dovodNehodnotenia || item.coChyba) && (
              <p className="text-[11px] text-gray-500 leading-snug pt-0.5">
                {item.dovodNehodnotenia || item.coChyba}
              </p>
            )}
            {item.vysvetlenie && (
              <div className="flex items-start gap-1 pt-0.5">
                <p className="text-[11px] text-gray-500 leading-snug flex-1">
                  {item.vysvetlenie.sumar}{' '}
                  {onZobrazVypocet && (
                    <button
                      type="button"
                      onClick={() => onZobrazVypocet(item.vysvetlenie!)}
                      className="text-[#52A8DE] hover:underline whitespace-nowrap"
                    >
                      Zobraziť výpočet
                    </button>
                  )}
                </p>
                <CopyButton text={item.vysvetlenie.sumar} label={`Kopírovať zhrnutie – ${item.label}`} />
              </div>
            )}
          </div>
        );
      })}
      {poznamka && <p className="text-[11px] text-gray-400 pt-1 leading-snug">{poznamka}</p>}
    </div>
  );
}

function RecommendationCard({ rec, index }: { rec: Odporucanie; index: number }) {
  const [isOpen, setIsOpen] = useState(index < 3);

  const priorityColors = {
    'vysoká': 'bg-red-100 text-red-700',
    'stredná': 'bg-amber-100 text-amber-700',
    'nízka': 'bg-blue-100 text-blue-700',
  };

  const categoryColors = {
    'MZI': 'bg-[#2D7D46]/10 text-[#2D7D46]',
    'OZE': 'bg-[#2196F3]/10 text-[#2196F3]',
    'ENERGETIKA': 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-400 w-6">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800">{rec.opatrenie.nazov}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityColors[rec.priorita]}`}>
              {rec.priorita}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${categoryColors[rec.opatrenie.kategoria]}`}>
              {rec.opatrenie.kategoria}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{rec.dovod}</p>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-700">{rec.opatrenie.popis}</p>
          {rec.potencial && (
            <p className="text-sm text-[#52A8DE] font-medium">{rec.potencial}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Orientačná cena</span>
              <p className="font-medium text-gray-700">{rec.opatrenie.orientacnaCena}</p>
            </div>
            <div>
              <span className="text-gray-500">Návratnosť</span>
              <p className="font-medium text-gray-700">{rec.opatrenie.navratnost}</p>
            </div>
            <div>
              <span className="text-gray-500">Náročnosť</span>
              <p className="font-medium text-gray-700">{rec.opatrenie.narocnostRealizacie}</p>
            </div>
            <div>
              <span className="text-gray-500">Dotácie</span>
              <p className="font-medium text-gray-700">{rec.opatrenie.dotacie}</p>
            </div>
          </div>
          {rec.opatrenie.benefity.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Benefity:</span>
              <ul className="mt-1 space-y-0.5">
                {rec.opatrenie.benefity.map((b, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-[#52A8DE] mt-0.5">•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rec.opatrenie.krokyRealizacie.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Kroky realizácie:</span>
              <ol className="mt-1 space-y-0.5 list-decimal list-inside">
                {rec.opatrenie.krokyRealizacie.map((k, i) => (
                  <li key={i} className="text-xs text-gray-600">{k}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
