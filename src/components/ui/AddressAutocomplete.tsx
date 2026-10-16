import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { KRAJE, OKRESY_BY_KRAJ } from '../../data/slovakLocations';
import { FeedbackButton } from './FeedbackButton';
import { dosadUlicu } from '../../utils/uliceSR';
import { lokalneNavrhy as navrhyZRegistra, type AdresyObce } from '../../utils/adresySR';
import { useNavigaciaZoznamu } from '../../hooks/useNavigaciaZoznamu';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: { ulica: string; obec: string; okres: string; kraj: string }) => void;
  countryCode: string; // 'sk', 'cz', or ''
  placeholder?: string;
  label?: string;
  /**
   * Ulice zvolenej obce z Registra adries. Keď sú zadané, návrhy sa ponúkajú z nich,
   * lokálne, a návrhy z externej služby (Photon) sa nevolajú, takže zadaný text nikam
   * neodchádza. Bez nich (obec nie je zvolená alebo nemá ulice) platí pôvodné správanie.
   */
  lokalneUlice?: string[] | null;
  /** Čísla domov zvolenej obce z Registra adries (súbor z nášho servera). */
  lokalneAdresy?: AdresyObce | null;
  /** Obec, ku ktorej patria ulice a čísla (len na popis nad návrhmi). */
  obecUlic?: string;
}

interface PhotonFeature {
  type: 'Feature';
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
  };
  geometry: { type: string; coordinates: [number, number] };
}

interface PhotonResult {
  ulica: string;
  obec: string;
  okres: string;
  kraj: string;
  displayPrimary: string;
  displaySecondary: string;
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function matchKraj(state: string): string {
  if (!state) return '';
  const norm = normalize(state.trim());
  const exact = KRAJE.find(k => normalize(k) === norm);
  if (exact) return exact;
  return KRAJE.find(k => norm.includes(normalize(k.split(' ')[0]))) ?? '';
}

function matchOkres(county: string, kraj: string): string {
  if (!county) return '';
  const stripped = county.replace(/^[Oo]kres\s+/, '').trim();
  const pool = kraj ? (OKRESY_BY_KRAJ[kraj] ?? []) : Object.values(OKRESY_BY_KRAJ).flat();
  return (
    pool.find(o => normalize(o) === normalize(stripped)) ??
    pool.find(o => normalize(stripped).includes(normalize(o))) ??
    ''
  );
}

function featureToResult(f: PhotonFeature): PhotonResult {
  const p = f.properties;
  const streetPart = p.street || p.name || '';
  const housePart = p.housenumber || '';
  const ulica = `${streetPart} ${housePart}`.trim();
  const obec = p.city || p.district || '';
  const kraj = matchKraj(p.state || '');
  const okres = matchOkres(p.county || '', kraj);

  const displayPrimary = ulica || p.name || '';
  const displaySecondary = [obec, okres].filter(Boolean).join(', ');

  return { ulica, obec, okres, kraj, displayPrimary, displaySecondary };
}

const inputClasses =
  'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none';

function nadpisLokalnych(druh: 'ulice' | 'cisla', ulica: string, obec: string): string {
  if (druh === 'ulice') return `Ulice v obci ${obec}`;
  return ulica
    ? `Čísla domov na ulici ${ulica}, súpisné/orientačné`
    : `Čísla domov v obci ${obec}`;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  countryCode,
  placeholder,
  label,
  lokalneUlice = null,
  lokalneAdresy = null,
  obecUlic = '',
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<PhotonResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // If no supported countryCode, render plain input
  const isSupported = countryCode === 'sk' || countryCode === 'cz';
  const lokalnyRezim =
    (lokalneUlice !== null && lokalneUlice.length > 0) ||
    (lokalneAdresy !== null && Object.keys(lokalneAdresy).length > 0);
  const [lokalneOtvorene, setLokalneOtvorene] = useState(false);
  const lokalneNavrhy = lokalnyRezim ? navrhyZRegistra(value, lokalneUlice ?? [], lokalneAdresy) : null;

  const fetchResults = useCallback(async (query: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const url =
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=sk&limit=8&countrycodes=${countryCode}`;
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) return;
      const data = await res.json();
      const features: PhotonFeature[] = data.features ?? [];

      // Prefer house/street features
      let filtered = features.filter(
        f => f.properties.type === 'house' || (f.properties.street && f.properties.housenumber)
      );
      if (filtered.length === 0) filtered = features;

      setResults(filtered.slice(0, 8).map(featureToResult));
      setIsOpen(true);
    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [countryCode]);

  useEffect(() => {
    if (!isSupported || lokalnyRezim) {
      // Ulice sú k dispozícii lokálne: externá služba sa nevolá a staré návrhy zmiznú.
      setResults([]);
      setIsOpen(false);
      return undefined;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, isSupported, lokalnyRezim, fetchResults]);

  const handleSelect = useCallback(
    (result: PhotonResult) => {
      onChange(result.ulica || result.displayPrimary);
      onSelect({
        ulica: result.ulica || result.displayPrimary,
        obec: result.obec,
        okres: result.okres,
        kraj: result.kraj,
      });
      setIsOpen(false);
      setResults([]);
    },
    [onChange, onSelect]
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => { setIsOpen(false); setLokalneOtvorene(false); }, 150);
  }, []);

  const handleSelectLokalna = useCallback(
    (polozka: string) => {
      if (lokalneNavrhy?.druh === 'cisla') {
        onChange(`${lokalneNavrhy.ulica} ${polozka}`.trim());
        setLokalneOtvorene(false);
      } else {
        const ulice = lokalneUlice ?? Object.keys(lokalneAdresy ?? {}).filter((k) => k !== '');
        onChange(dosadUlicu(value, polozka, ulice));
        // Po výbere ulice zoznam ostane otvorený: ponúkne sa číslo domu.
        setLokalneOtvorene(true);
      }
    },
    [onChange, value, lokalneUlice, lokalneAdresy, lokalneNavrhy],
  );

  const lokalnyZoznamViditelny = lokalnyRezim && lokalneOtvorene && lokalneNavrhy !== null;
  const photonZoznamViditelny = !lokalnyRezim && isOpen && results.length > 0;
  const polozkyLokalne = lokalneNavrhy?.polozky ?? [];

  // Jeden zoznam je viditeľný naraz: lokálny z registra, alebo z externej služby.
  const navigacia = useNavigaciaZoznamu({
    pocet: lokalnyRezim ? polozkyLokalne.length : results.length,
    otvoreny: lokalnyRezim ? lokalnyZoznamViditelny && polozkyLokalne.length > 0 : photonZoznamViditelny,
    otvor: () => (lokalnyRezim ? setLokalneOtvorene(true) : setIsOpen(true)),
    zatvor: () => { setIsOpen(false); setLokalneOtvorene(false); },
    vyber: (index) => (lokalnyRezim ? handleSelectLokalna(polozkyLokalne[index]) : handleSelect(results[index])),
    kluc: lokalnyRezim ? `L|${lokalneNavrhy?.druh}|${lokalneNavrhy?.ulica}|${polozkyLokalne.join('|')}` : `P|${results.map((r) => r.displayPrimary).join('|')}`,
  });

  return (
    <div className="flex flex-col gap-1 relative">
      {label && (
        <label className="flex items-center text-sm font-medium text-gray-700">
          {label}
          <FeedbackButton fieldLabel={label} />
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setLokalneOtvorene(true); }}
          onFocus={() => setLokalneOtvorene(true)}
          onBlur={handleBlur}
          onKeyDown={navigacia.onKeyDown}
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={lokalnyZoznamViditelny || photonZoznamViditelny}
          aria-controls={navigacia.idZoznamu}
          aria-activedescendant={navigacia.aktivny >= 0 ? navigacia.idMoznosti(navigacia.aktivny) : undefined}
          placeholder={placeholder}
          className={inputClasses}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
      {lokalnyZoznamViditelny && lokalneNavrhy !== null && (
        <ul
          id={navigacia.idZoznamu}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-64 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
          aria-label={nadpisLokalnych(lokalneNavrhy.druh, lokalneNavrhy.ulica, obecUlic)}
        >
          <li className="px-3 pt-2 pb-1 text-xs text-gray-600" role="presentation" aria-hidden="true">
            {nadpisLokalnych(lokalneNavrhy.druh, lokalneNavrhy.ulica, obecUlic)} (Register adries)
          </li>
          {lokalneNavrhy.polozky.map((polozka, index) => (
            <li
              key={polozka}
              id={navigacia.idMoznosti(index)}
              role="option"
              aria-selected={index === navigacia.aktivny}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#52A8DE]/10 hover:text-brand-strong ${index === navigacia.aktivny ? 'bg-[#52A8DE]/10 text-brand-strong' : ''}`}
              onMouseMove={() => navigacia.nastavAktivny(index)}
              onClick={() => handleSelectLokalna(polozka)}
            >
              {polozka}
            </li>
          ))}
        </ul>
      )}
      {photonZoznamViditelny && (
        <ul
          id={navigacia.idZoznamu}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-64 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((r, i) => (
            <li
              key={i}
              id={navigacia.idMoznosti(i)}
              role="option"
              aria-selected={i === navigacia.aktivny}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#52A8DE]/10 hover:text-brand-strong ${i === navigacia.aktivny ? 'bg-[#52A8DE]/10 text-brand-strong' : ''}`}
              onMouseMove={() => navigacia.nastavAktivny(i)}
              onClick={() => handleSelect(r)}
            >
              <div className="font-medium">{r.displayPrimary}</div>
              {r.displaySecondary && (
                <div className="text-xs text-gray-500">{r.displaySecondary}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
