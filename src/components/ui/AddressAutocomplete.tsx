import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { KRAJE, OKRESY_BY_KRAJ } from '../../data/slovakLocations';
import { FeedbackButton } from './FeedbackButton';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: { ulica: string; obec: string; okres: string; kraj: string }) => void;
  countryCode: string; // 'sk', 'cz', or ''
  placeholder?: string;
  label?: string;
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

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  countryCode,
  placeholder,
  label,
}: AddressAutocompleteProps) {
  const [results, setResults] = useState<PhotonResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // If no supported countryCode, render plain input
  const isSupported = countryCode === 'sk' || countryCode === 'cz';

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
    if (!isSupported) return;
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
  }, [value, isSupported, fetchResults]);

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
    setTimeout(() => setIsOpen(false), 150);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setIsOpen(false);
  }, []);

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
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
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
      {isOpen && results.length > 0 && (
        <ul
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-64 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((r, i) => (
            <li
              key={i}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-[#52A8DE]/10 hover:text-[#52A8DE]"
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
