import { BarChart3, Download, FileText, ChevronDown, ChevronRight, TableProperties, Settings2, Info } from 'lucide-react';
import { useState } from 'react';
import { Areal, ScoringWeights } from '../../types/areal';
import { useScoring } from '../../hooks/useScoring';
import { useRecommendations } from '../../hooks/useRecommendations';
import { ScoreGauge } from '../ui/ScoreGauge';
import {
  EnergiaScore, KlimaskenStupen, MZIKomponent,
  dovodNehodnoteniaEnergetiky, getScoreLevel, saHodnotiEnergetika, saHodnotiOZE, vazeneCelkoveSkore,
} from '../../types/scoring';
import { Odporucanie } from '../../types/catalog';
import { exportToXlsx } from '../../utils/xlsxExport';
import { csvFilename } from '../../utils/exportFilenames';
import { computeArealEnPI, ArealEnPI } from '../../utils/energyIndicators';
import {
  VysvetlenieKomponentu, vysvetleniaEnergetiky, vysvetleniaMZI, vysvetleniaOZE,
} from '../../utils/skoreVysvetlenie';
import { CopyButton } from '../ui/CopyButton';
import { VypocetDialog } from './VypocetDialog';
import { bezDiakritiky } from '../../utils/formatters';
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

  // Vysvetlenia komponentov skóre — veta na kartu a tabuľka do modálneho okna (#213).
  const vysvetlenia = new Map(
    [
      ...vysvetleniaMZI(areal, score.mzi),
      ...vysvetleniaOZE(score.oze),
      ...vysvetleniaEnergetiky(score.energia),
    ].map((v) => [v.kluc, v]),
  );

  const radarData = [
    { subject: 'MZI', value: score.mzi.celkove, fullMark: 100 },
    // Nehodnotená oblasť sa v grafe nezobrazuje ako nula (#203, #204, #205).
    ...(saHodnotiOZE(score.oze)
      ? [{ subject: 'OZE', value: score.oze.celkove, fullMark: 100 }]
      : []),
    ...(saHodnotiEnergetika(score.energia)
      ? [{ subject: 'Energia', value: score.energia.celkove, fullMark: 100 }]
      : []),
  ];

  // Vážené celkové skóre. Oblasť, ktorú nie je z čoho počítať, sa nehodnotí
  // a do váženého priemeru nevstupuje — OZE a energetika bez budov (#204, #205),
  // energetika aj vtedy, keď sú všetky budovy sezónne nevykurované (#203).
  const { mzi: wMzi, oze: wOze, energia: wEnergia } = areal.vahy;
  const sumVah = wMzi + wOze + wEnergia;
  const hodnotiOZE = saHodnotiOZE(score.oze);
  const hodnotiEnergetiku = saHodnotiEnergetika(score.energia);
  const vazeneSkore = sumVah > 0 ? vazeneCelkoveSkore(score, areal.vahy) : score.celkove;

  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const rows: string[][] = [
      ['Areál', areal.nazov],
      ['Adresa', areal.adresa],
      ['Obec', areal.obec],
      ['Región', areal.region],
      [''],
      ['Celkové skóre (vážené)', String(vazeneSkore)],
      ['Celkové skóre (nevážené)', String(score.celkove)],
      ['MZI skóre', String(score.mzi.celkove), `váha: ${wMzi}`],
      ['OZE skóre', hodnotiOZE ? String(score.oze.celkove) : 'nehodnotené', `váha: ${wOze}`],
      ['Energetika skóre', hodnotiEnergetiku ? String(score.energia.celkove) : 'nehodnotené', `váha: ${wEnergia}`],
      [''],
      ['Pozemky', String(areal.pozemky.length)],
      ['Budovy', String(areal.budovy.length)],
      [''],
      ['Odporúčania:'],
      ...recommendations.map((r) => [r.opatrenie.nazov, r.priorita, r.dovod]),
    ];
    const csv = BOM + rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
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
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let y = 20;
    doc.setFontSize(18);
    doc.text('Hodnotenie adaptacnych opatreni', 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Areal: ${areal.nazov}`, 20, y);
    y += 7;
    doc.text(`Adresa: ${areal.adresa}, ${areal.obec}`, 20, y);
    y += 7;
    doc.text(`Datum: ${new Date().toLocaleDateString('sk')}`, 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.text('Celkove skore', 20, y);
    y += 8;
    doc.setFontSize(24);
    doc.text(`${vazeneSkore} / 100`, 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`(vazene: MZI×${wMzi} OZE×${wOze} Energia×${wEnergia})`, 20, y);
    doc.setTextColor(0);
    y += 10;
    doc.setFontSize(11);
    const ozeText = hodnotiOZE ? `${score.oze.celkove}/100` : 'nehodnotene';
    const energiaText = hodnotiEnergetiku ? `${score.energia.celkove}/100` : 'nehodnotene';
    doc.text(`MZI: ${score.mzi.celkove}/100   OZE: ${ozeText}   Energia: ${energiaText}`, 20, y);
    y += 15;

    // Médiá
    if (areal.media.length > 0) {
      doc.setFontSize(13);
      doc.text('Foto a video material', 20, y);
      y += 7;
      doc.setFontSize(9);
      for (const m of areal.media) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`• ${m.nazov}${m.popis ? ` – ${m.popis}` : ''}`, 22, y);
        y += 5;
        if (m.typ === 'foto' && m.dataUrl) {
          try {
            doc.addImage(m.dataUrl, 'JPEG', 22, y, 50, 35);
            y += 40;
          } catch { /* skip invalid images */ }
        }
      }
      y += 5;
    }

    doc.setFontSize(14);
    doc.text('Odporucania', 20, y);
    y += 8;
    doc.setFontSize(10);
    for (const rec of recommendations.slice(0, 10)) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`[${rec.priorita}] ${rec.opatrenie.nazov}`, 20, y);
      y += 5;
      doc.setTextColor(100);
      doc.text(`  ${rec.dovod}`, 22, y);
      doc.setTextColor(0);
      y += 7;
    }

    y += 10;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text('Toto hodnotenie je orientacne. Pre presny navrh kontaktujte odbornika.', 20, y);
    y += 5;
    // Štandardný font jsPDF nemá slovenskú diakritiku — text ide bez nej (rovnako ako ostatné texty v PDF).
    doc.text(doc.splitTextToSize(bezDiakritiky(UPOZORNENIE_ROZSAH_HODNOTENIA), 170), 20, y);

    doc.save(`${areal.nazov || 'areal'}-hodnotenie.pdf`);
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
          <div><abbr title="Modro-zelená infraštruktúra" className="no-underline font-semibold">MZI</abbr> – Modro-zelená infraštruktúra</div>
          <div><abbr title="Obnoviteľné zdroje energie" className="no-underline font-semibold">OZE</abbr> – Obnoviteľné zdroje energie</div>
          <div><abbr title="Tepelné čerpadlo" className="no-underline font-semibold">TČ</abbr> – Tepelné čerpadlo</div>
          <div><abbr title="Netto úžitková plocha" className="no-underline font-semibold">NUS</abbr> – Netto úžitková plocha</div>
          <div><abbr title="Fotovoltika" className="no-underline font-semibold">FV</abbr> – Fotovoltika (solárne panely)</div>
          <div><abbr title="Centrálne zásobovanie teplom" className="no-underline font-semibold">CZT</abbr> – Centrálne zásobovanie teplom</div>
          <div><abbr title="Light Emitting Diode – dióda emitujúca svetlo" className="no-underline font-semibold">LED</abbr> – Úsporné osvetlenie</div>
        </div>
      </details>

      {/* Score Gauges */}
      <div className="flex flex-wrap justify-center gap-8">
        <div className="text-center">
          <ScoreGauge score={vazeneSkore} label="Celkové skóre (vážené)" size="lg" />
          {sumVah !== 3 && (
            <p className="text-xs text-gray-400 mt-1">
              Váhy: MZI×{wMzi} OZE×{wOze} Energia×{wEnergia}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        <ScoreGauge score={score.mzi.celkove} label="Modro-zelená infraštruktúra" size="md" />
        {hodnotiOZE
          ? <ScoreGauge score={score.oze.celkove} label="Obnoviteľné zdroje energie" size="md" />
          : <OblastNehodnotena
              nazov="Obnoviteľné zdroje energie"
              vysvetlenie="Areál nemá zadanú žiadnu budovu. OZE skóre stojí na strechách a zdrojoch tepla budov, takže ho nie je z čoho počítať — do celkového skóre nevstupuje."
            />}
        {hodnotiEnergetiku
          ? <ScoreGauge score={score.energia.celkove} label="Energetická efektívnosť" size="md" />
          : <EnergetikaNehodnotena energia={score.energia} />}
      </div>

      {/* Váhy nastavenie */}
      {updateVahy && (
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
                {(['mzi', 'oze', 'energia'] as const).map((oblast) => (
                  <div key={oblast}>
                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                      {oblast === 'mzi' ? 'MZI' : oblast === 'oze' ? 'OZE' : 'Energia'}
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

      {/* Radar Chart */}
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

      {/* Score Detail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreDetail
          title="MZI"
          items={[
            {
              label: 'Priepustnosť a zeleň areálu',
              ...komponentBody(score.mzi.okolie, 45),
              hodnota: koeficientText(score.mzi.koefOkolie, score.mzi.stupenOkolie),
              vysvetlenie: vysvetlenia.get('okolie'),
            },
            {
              label: 'Zeleň a retencia na budovách',
              ...komponentBody(score.mzi.budovy, 25),
              hodnota: koeficientText(score.mzi.koefBudovy, score.mzi.stupenBudovy),
              vysvetlenie: vysvetlenia.get('budovy'),
            },
            {
              label: 'Akumulácia zrážkovej vody',
              ...komponentBody(score.mzi.akumulacia, 15),
              hodnota: score.mzi.akumulaciaPercent === null || score.mzi.stupenAkumulacia === null
                ? null
                : `${Math.round(score.mzi.akumulaciaPercent)} % · ${score.mzi.stupenAkumulacia}`,
              vysvetlenie: vysvetlenia.get('akumulacia'),
              dovodNehodnotenia: areal.nadrzNieJeMozna === 1
                ? `Nádrž nie je možné inštalovať${areal.nadrzNemoznaDovod.trim() ? ` — ${areal.nadrzNemoznaDovod.trim()}` : ''}.`
                : null,
            },
            {
              label: 'Odtok zo spevnených plôch',
              ...komponentBody(score.mzi.odtok, 15),
              hodnota: score.mzi.podielZadrzanehoOdtoku === null
                ? null
                : `${Math.round(score.mzi.podielZadrzanehoOdtoku * 100)} %`,
              vysvetlenie: vysvetlenia.get('odtok'),
            },
          ]}
          poznamka="Koeficienty MZI a päťstupňová škála A–E podľa metodiky KLIMASKEN (metodické listy B-GOV2, B-GOV3, B-AD10). Komponenty bez údajov sa do skóre nezapočítavajú."
          onZobrazVypocet={setVypocet}
        />
        {hodnotiOZE && (
          <ScoreDetail
            title="OZE"
            items={[
              { label: 'Vhodnosť strechy', score: score.oze.vhodnostStrechyPreSolar, max: 30, vysvetlenie: vysvetlenia.get('vhodnostStrechyPreSolar') },
              { label: 'Existujúce OZE', score: score.oze.existujuceOZE, max: 20, vysvetlenie: vysvetlenia.get('existujuceOZE') },
              { label: 'Potenciál tepelného čerpadla (TČ)', score: score.oze.potencialTepelnehoCerpadla, max: 25, vysvetlenie: vysvetlenia.get('potencialTepelnehoCerpadla') },
              { label: 'Potenciál ďalších OZE', score: score.oze.potencialDalsichOZE, max: 25, vysvetlenie: vysvetlenia.get('potencialDalsichOZE') },
            ]}
            onZobrazVypocet={setVypocet}
          />
        )}
        {hodnotiEnergetiku && (
          <ScoreDetail
            title="Energetika"
            items={[
              { label: 'Zateplenie', score: score.energia.zateplenie, max: 30, vysvetlenie: vysvetlenia.get('zateplenie') },
              { label: 'Kvalita okien', score: score.energia.kvalitaOkien, max: 20, vysvetlenie: vysvetlenia.get('kvalitaOkien') },
              { label: 'Vykurovací systém', score: score.energia.vykurovaciSystem, max: 25, vysvetlenie: vysvetlenia.get('vykurovaciSystem') },
              { label: 'Vetranie/LED', score: score.energia.vetranie, max: 25, vysvetlenie: vysvetlenia.get('vetranie') },
            ]}
            onZobrazVypocet={setVypocet}
          />
        )}
      </div>

      {/* Energetické ukazovatele (EnPI) — issue #171 */}
      <EnergyIndicators enpi={enpi} />

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

const fmtNum = (n: number | undefined, digits = 0) =>
  n === undefined ? '–' : n.toLocaleString('sk', { maximumFractionDigits: digits });

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
  const pocet = energia.vynechanychSezonnych;
  const vysvetlenie = dovodNehodnoteniaEnergetiky(energia) === 'bezBudov' ? (
    'Areál nemá zadanú žiadnu budovu. Energetickú efektívnosť nie je z čoho počítať, preto do celkového skóre nevstupuje.'
  ) : (
    <>
      {pocet === 1
        ? 'Jediná stavba areálu je sezónna nevykurovaná (letné sídlo).'
        : `Všetkých ${pocet} stavieb areálu je sezónnych nevykurovaných (letné sídlo).`}
      {' '}Zateplenie ani obnova vykurovania v nich nemajú zmysel, preto sa areálu
      nepočíta ani potenciál zlepšenia v tejto oblasti.
    </>
  );
  return <OblastNehodnotena nazov="Energetická efektívnosť" vysvetlenie={vysvetlenie} />;
}

interface ScoreDetailItem {
  label: string;
  /** `null` = komponent sa nedal vypočítať, do skóre sa nezapočítal */
  score: number | null;
  max: number;
  /** Doplnková hodnota indikátora (koeficient, percento, stupeň A–E) */
  hodnota?: string | null;
  /** Vysvetlenie, za čo body sú — veta na kartu a tabuľka do modálu (#213) */
  vysvetlenie?: VysvetlenieKomponentu;
  /**
   * Prečo sa komponent nehodnotí, keď to nie je chýbajúcimi údajmi —
   * napr. nádrž nie je možné inštalovať (#215).
   */
  dovodNehodnotenia?: string | null;
}

/** Rozloží komponent MZI skóre na tvar, ktorý zobrazuje `ScoreDetail`. */
function komponentBody(
  komponent: MZIKomponent | null,
  max: number,
): { score: number | null; max: number } {
  return komponent === null ? { score: null, max } : { score: komponent.body, max: komponent.max };
}

function koeficientText(koef: number | null, stupen: KlimaskenStupen | null): string | null {
  if (koef === null || stupen === null) return null;
  return `${koef.toFixed(2)} · ${stupen}`;
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
            {item.score === null && item.dovodNehodnotenia && (
              <p className="text-[11px] text-gray-500 leading-snug pt-0.5">
                {item.dovodNehodnotenia}
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
