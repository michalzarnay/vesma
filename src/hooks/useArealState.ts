import { useReducer, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
  Areal, Pozemok, Budova, InaStavba, BGOpatrenie, MediaItem, ScoringWeights,
  createEmptyAreal, createEmptyPozemok, createEmptyBudova,
  createEmptyInaStavba, createEmptyBGOpatrenie,
} from '../types/areal';
import { FUEL_CONVERSIONS } from '../data/constants';
import { getTotalHeatingCost } from '../utils/calculations';
import { dbSaveMedia, dbLoadMedia } from '../utils/mediaDb';

type Action =
  | { type: 'SET_AREAL'; payload: Areal }
  | { type: 'UPDATE_AREAL'; payload: Partial<Areal> }
  | { type: 'ADD_POZEMOK' }
  | { type: 'UPDATE_POZEMOK'; payload: { index: number; data: Partial<Pozemok> } }
  | { type: 'REMOVE_POZEMOK'; payload: number }
  | { type: 'ADD_BUDOVA' }
  | { type: 'UPDATE_BUDOVA'; payload: { index: number; data: Partial<Budova> } }
  | { type: 'REMOVE_BUDOVA'; payload: number }
  | { type: 'ADD_INA_STAVBA' }
  | { type: 'UPDATE_INA_STAVBA'; payload: { index: number; data: Partial<InaStavba> } }
  | { type: 'REMOVE_INA_STAVBA'; payload: number }
  | { type: 'ADD_BG_OPATRENIE' }
  | { type: 'UPDATE_BG_OPATRENIE'; payload: { index: number; data: Partial<BGOpatrenie> } }
  | { type: 'REMOVE_BG_OPATRENIE'; payload: number }
  | { type: 'ADD_MEDIA'; payload: MediaItem }
  | { type: 'UPDATE_MEDIA'; payload: { id: string; data: Partial<MediaItem> } }
  | { type: 'REMOVE_MEDIA'; payload: string }
  | { type: 'UPDATE_VAHY'; payload: Partial<ScoringWeights> }
  | { type: 'RESET' };

function migratePozemok(raw: unknown): Pozemok {
  const empty = createEmptyPozemok();
  const d = raw as Pozemok & { odvodVodyKanalizacia?: number };
  // Migrate old single kanalizácia field to new joint sewer field
  const legacyKanalizacia = d.odvodVodyKanalizacia ?? 0;
  return {
    ...empty,
    ...d,
    odvodVodyJednotnaKanalizacia: d.odvodVodyJednotnaKanalizacia ?? legacyKanalizacia,
    odvodVodySplaskovaKanalizacia: d.odvodVodySplaskovaKanalizacia ?? 0,
    odvodVodyZrazkovaKanalizacia: d.odvodVodyZrazkovaKanalizacia ?? 0,
    odvodVodyRetencnaNadrzou: d.odvodVodyRetencnaNadrzou ?? 0,
    dazdovaZahradaPlochaStrechy: d.dazdovaZahradaPlochaStrechy ?? 0,
    dazdovaZahradaPlochaTerenu: d.dazdovaZahradaPlochaTerenu ?? 0,
    jazierkoPrepadRieseny: d.jazierkoPrepadRieseny ?? 0,
    jazierkoSmerPrepadu: d.jazierkoSmerPrepadu ?? '',
    kapacitaNadrzSebahodnotenie: d.kapacitaNadrzSebahodnotenie ?? 0,
    zelenaStrechaExtenzivnaPloca: d.zelenaStrechaExtenzivnaPloca ?? 0,
    zelenaStrechaExtenzivnaSikma: d.zelenaStrechaExtenzivnaSikma ?? 0,
    zelenaStrechaIntenzivna: d.zelenaStrechaIntenzivna ?? 0,
    zelenaStrechaModrozelena: d.zelenaStrechaModrozelena ?? 0,
    zelenaStrechaStrkova: d.zelenaStrechaStrkova ?? 0,
    zelenaStenaNaPozemku: d.zelenaStenaNaPozemku ?? 0,
    vsakovaciaPrehlbenaBezpecnostnyPrepad: d.vsakovaciaPrehlbenaBezpecnostnyPrepad ?? 0,
    vsakovaciaPrehlbenaRegulovanyOdtok: d.vsakovaciaPrehlbenaRegulovanyOdtok ?? 0,
    prekorenetelnyPriestorPreStromy: d.prekorenetelnyPriestorPreStromy ?? 0,
    plochaVhodnaPreFV: d.plochaVhodnaPreFV ?? 0,
  };
}

function migrateBudova(raw: unknown): Budova {
  const empty = createEmptyBudova();
  const d = raw as Budova;
  return {
    ...empty,
    ...d,
    // issue #181: staršie relácie vykurovanú plochu nemajú — predvyplní sa z úžitkovej
    vykurovanaPlocha: d.vykurovanaPlocha ?? d.uzitkovaPlochaNUS ?? 0,
    plochaObvodovehoPlasta: d.plochaObvodovehoPlasta ?? 0,
    spotrebaRok: d.spotrebaRok ?? 0,
    kureniePlynNakladyRok: d.kureniePlynNakladyRok ?? 0,
    kurenieElektrinaNakladyRok: d.kurenieElektrinaNakladyRok ?? 0,
    tepelneCerpadloNakladyRok: d.tepelneCerpadloNakladyRok ?? 0,
    kureniePeletyNakladyRok: d.kureniePeletyNakladyRok ?? 0,
    kurenieStiepkaNakladyRok: d.kurenieStiepkaNakladyRok ?? 0,
    kurenieUhlimDrevomNakladyRok: d.kurenieUhlimDrevomNakladyRok ?? 0,
    spotrebaElektrinyNakladyRok: d.spotrebaElektrinyNakladyRok ?? 0,
    // issue #170: ukazovatele z energetického certifikátu
    certifikatPotrebaVykurovanie: d.certifikatPotrebaVykurovanie ?? 0,
    certifikatPotrebaTeplaVoda: d.certifikatPotrebaTeplaVoda ?? 0,
    certifikatPrimarnaEnergia: d.certifikatPrimarnaEnergia ?? 0,
    povodnovoRiziko: d.povodnovoRiziko ?? 0,
    budovaZaplavenaPoslednychRokov: d.budovaZaplavenaPoslednychRokov ?? 0,
    castPodTerenomBezOdcerpania: d.castPodTerenomBezOdcerpania ?? 0,
    technologickeZariadenieSuteren: d.technologickeZariadenieSuteren ?? 0,
    kanalizacneVpusteNadSuterenom: d.kanalizacneVpusteNadSuterenom ?? 0,
    potrubiaNeSpljajuNormy: d.potrubiaNeSpljajuNormy ?? 0,
    chybajuMriazkyNaVtokoch: d.chybajuMriazkyNaVtokoch ?? 0,
    dazdovaKanalizaciaBezZariadenia: d.dazdovaKanalizaciaBezZariadenia ?? 0,
    pripojkaBezSpatnejKlapky: d.pripojkaBezSpatnejKlapky ?? 0,
    elektrickeZariadeniaSuterenNizko: d.elektrickeZariadeniaSuterenNizko ?? 0,
    uzaverPlynuSuteren: d.uzaverPlynuSuteren ?? 0,
    vyuzitieDazdovejVodyVObjekte: d.vyuzitieDazdovejVodyVObjekte ?? 0,
    obvodoveStenyMaterial: d.obvodoveStenyMaterial ?? '',
    zateplenieFasadyMaterial: d.zateplenieFasadyMaterial ?? '',
    celkovaPlochaPresklenia: d.celkovaPlochaPresklenia ?? 0,
    vekTermoizolacnychOkien: d.vekTermoizolacnychOkien ?? 0,
    objemVyvetranehoPrezduchu: d.objemVyvetranehoPrezduchu ?? 0,
    rekuperaciaCentralnaUcinnost: d.rekuperaciaCentralnaUcinnost ?? 0,
    rekuperaciaLokalnaDo75: d.rekuperaciaLokalnaDo75 ?? 0,
    rekuperaciaLokalnaOd76do89: d.rekuperaciaLokalnaOd76do89 ?? 0,
    rekuperaciaLokalnaOd90: d.rekuperaciaLokalnaOd90 ?? 0,
    celkovyStavBudovy: d.celkovyStavBudovy ?? '',
    zelenaStrechaBudovExtenzivnaPloca: d.zelenaStrechaBudovExtenzivnaPloca ?? 0,
    zelenaStrechaBudovExtenzivnaSikma: d.zelenaStrechaBudovExtenzivnaSikma ?? 0,
    zelenaStrechaBudovIntenzivna: d.zelenaStrechaBudovIntenzivna ?? 0,
    zelenaStrechaBudovModrozelena: d.zelenaStrechaBudovModrozelena ?? 0,
    zelenaStrechaBudovStrkova: d.zelenaStrechaBudovStrkova ?? 0,
    zelenaStenaBudov: d.zelenaStenaBudov ?? 0,
    vystavbaPred1980: d.vystavbaPred1980 ?? 0,
  };
}

export function migrateAreal(raw: unknown): Areal {
  const empty = createEmptyAreal();
  const data = raw as Areal;
  return {
    ...empty,
    ...data,
    // issue #177: relácia bez čísla verzie pochádza spred jeho zavedenia
    schemaVersion: data.schemaVersion ?? 1,
    organizaciaVZriadovatelskejPobnonosti: data.organizaciaVZriadovatelskejPobnonosti ?? '',
    obhliadkuVykonal: data.obhliadkuVykonal ?? '',
    datumObhliadky: data.datumObhliadky ?? '',
    pritomnePOSOBY: data.pritomnePOSOBY ?? '',
    kapacitaZariadenia: data.kapacitaZariadenia ?? '',
    aktualnaObsadenost: data.aktualnaObsadenost ?? 0,
    pocetZamestnancov: data.pocetZamestnancov ?? 0,
    zaverBG: data.zaverBG ?? '',
    zaverOZE: data.zaverOZE ?? '',
    pozemky: (data.pozemky ?? [createEmptyPozemok()]).map(migratePozemok),
    budovy: (data.budovy ?? [createEmptyBudova()]).map(migrateBudova),
    media: data.media ?? [],
    vahy: data.vahy ?? { mzi: 1, oze: 1, energia: 1 },
  };
}

function computeBudovaFields(budova: Budova): Budova {
  // Auto-calculate category
  const uzitkova = budova.uzitkovaPlochaNUS;
  const kategoriaBudovy: 'S' | 'M' | 'L' =
    uzitkova <= 500 ? 'S' : uzitkova <= 1500 ? 'M' : 'L';

  // Auto-calculate green roof potential
  const potencialZelenejStrechy =
    budova.strechaTyp === 1 ? budova.plochaPodorysu : undefined;

  // Fuel conversions
  const kureniePeletySpotreba_kWh = budova.kureniePeletySpotreba_kg * FUEL_CONVERSIONS.pelety;
  const kurenieStiepkaSpotreba_kWh = budova.kurenieStiepkaSpotreba_kg * FUEL_CONVERSIONS.stiepka;

  let kurenieUhlimDrevomSpotreba_kWh = 0;
  if (budova.kurenieUhlimDrevom === 1) {
    kurenieUhlimDrevomSpotreba_kWh = budova.kurenieUhlimDrevomSpotreba_kg * FUEL_CONVERSIONS.uhlie;
  } else if (budova.kurenieUhlimDrevom === 2) {
    kurenieUhlimDrevomSpotreba_kWh = budova.kurenieUhlimDrevomSpotreba_kg * FUEL_CONVERSIONS.drevo;
  }

  // Total heating consumption
  const celkovaSpotreba =
    budova.kureniePlynSpotreba +
    budova.kurenieElektrinaSpotreba +
    budova.tepelneCerpadloSpotreba +
    kureniePeletySpotreba_kWh +
    kurenieStiepkaSpotreba_kWh +
    kurenieUhlimDrevomSpotreba_kWh +
    budova.kurenieCZTSpotreba;

  // Total heating cost in EUR (issue #173)
  const celkoveNakladyKurenie = getTotalHeatingCost(budova);

  return {
    ...budova,
    kategoriaBudovy,
    potencialZelenejStrechy,
    kureniePeletySpotreba_kWh,
    kurenieStiepkaSpotreba_kWh,
    kurenieUhlimDrevomSpotreba_kWh,
    celkovaSpotreba,
    celkoveNakladyKurenie,
  };
}

/**
 * Zlúči zmenu do budovy a prepočíta odvodené polia.
 * Issue #181: vykurovaná plocha sa predvypĺňa z úžitkovej — kým ju používateľ
 * neupraví ručne (je 0 alebo rovná predchádzajúcej úžitkovej), sleduje úžitkovú plochu.
 */
export function applyBudovaUpdate(prev: Budova, data: Partial<Budova>): Budova {
  const updated = { ...prev, ...data };
  if (
    data.uzitkovaPlochaNUS !== undefined &&
    data.vykurovanaPlocha === undefined &&
    (prev.vykurovanaPlocha === 0 || prev.vykurovanaPlocha === prev.uzitkovaPlochaNUS)
  ) {
    updated.vykurovanaPlocha = data.uzitkovaPlochaNUS;
  }
  return computeBudovaFields(updated);
}

function arealReducer(state: Areal, action: Action): Areal {
  switch (action.type) {
    case 'SET_AREAL':
      return action.payload;

    case 'UPDATE_AREAL':
      return { ...state, ...action.payload };

    case 'ADD_POZEMOK':
      return { ...state, pozemky: [...state.pozemky, createEmptyPozemok()] };

    case 'UPDATE_POZEMOK': {
      const pozemky = [...state.pozemky];
      pozemky[action.payload.index] = {
        ...pozemky[action.payload.index],
        ...action.payload.data,
      };
      return { ...state, pozemky };
    }

    case 'REMOVE_POZEMOK': {
      if (state.pozemky.length <= 1) return state;
      const pozemky = state.pozemky.filter((_, i) => i !== action.payload);
      return { ...state, pozemky };
    }

    case 'ADD_BUDOVA':
      return { ...state, budovy: [...state.budovy, createEmptyBudova()] };

    case 'UPDATE_BUDOVA': {
      const budovy = [...state.budovy];
      budovy[action.payload.index] = applyBudovaUpdate(budovy[action.payload.index], action.payload.data);
      return { ...state, budovy };
    }

    case 'REMOVE_BUDOVA': {
      if (state.budovy.length <= 1) return state;
      const budovy = state.budovy.filter((_, i) => i !== action.payload);
      return { ...state, budovy };
    }

    case 'ADD_INA_STAVBA':
      return { ...state, ineStavby: [...state.ineStavby, createEmptyInaStavba()] };

    case 'UPDATE_INA_STAVBA': {
      const ineStavby = [...state.ineStavby];
      ineStavby[action.payload.index] = {
        ...ineStavby[action.payload.index],
        ...action.payload.data,
      };
      return { ...state, ineStavby };
    }

    case 'REMOVE_INA_STAVBA': {
      const ineStavby = state.ineStavby.filter((_, i) => i !== action.payload);
      return { ...state, ineStavby };
    }

    case 'ADD_BG_OPATRENIE':
      return { ...state, bgOpatrenia: [...state.bgOpatrenia, createEmptyBGOpatrenie()] };

    case 'UPDATE_BG_OPATRENIE': {
      const bgOpatrenia = [...state.bgOpatrenia];
      bgOpatrenia[action.payload.index] = {
        ...bgOpatrenia[action.payload.index],
        ...action.payload.data,
      };
      return { ...state, bgOpatrenia };
    }

    case 'REMOVE_BG_OPATRENIE': {
      const bgOpatrenia = state.bgOpatrenia.filter((_, i) => i !== action.payload);
      return { ...state, bgOpatrenia };
    }

    case 'ADD_MEDIA':
      return { ...state, media: [...state.media, action.payload] };

    case 'UPDATE_MEDIA': {
      const media = state.media.map((m) =>
        m.id === action.payload.id ? { ...m, ...action.payload.data } : m
      );
      return { ...state, media };
    }

    case 'REMOVE_MEDIA':
      return { ...state, media: state.media.filter((m) => m.id !== action.payload) };

    case 'UPDATE_VAHY':
      return { ...state, vahy: { ...state.vahy, ...action.payload } };

    case 'RESET':
      return createEmptyAreal();

    default:
      return state;
  }
}

const STORAGE_KEY = 'sma-nastroj-areal';

// Serializovaný „odtlačok" areálu na porovnanie neuložených zmien.
// dataUrl médií ignorujeme (rovnako ako pri ukladaní do localStorage), aby
// asynchrónne donačítanie médií z IndexedDB nevyvolalo falošný príznak zmeny.
function serializeForCompare(areal: Areal): string {
  return JSON.stringify({
    ...areal,
    media: areal.media.map((m) => ({ ...m, dataUrl: '' })),
  });
}

export function useArealState() {
  // Guard: don't overwrite IndexedDB with empty dataUrls before the initial load completes
  const mediaLoadedRef = useRef(false);
  const [mediaReady, setMediaReady] = useState(false);

  const [areal, dispatch] = useReducer(arealReducer, null, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return migrateAreal(JSON.parse(saved));
      }
    } catch { /* ignore */ }
    return createEmptyAreal();
  });

  // Odtlačok posledného „uloženého" (resp. načítaného / prázdneho) stavu.
  // Slúži na rozlíšenie, či má aktuálny areál reálne neuložené zmeny.
  const [baseline, setBaseline] = useState<string>(() => serializeForCompare(areal));
  const isDirty = useMemo(
    () => serializeForCompare(areal) !== baseline,
    [areal, baseline]
  );

  // On first mount: reload media with dataUrls from IndexedDB and merge into state
  useEffect(() => {
    dbLoadMedia()
      .then(items => {
        mediaLoadedRef.current = true;
        if (items.length > 0) {
          dispatch({ type: 'UPDATE_AREAL', payload: { media: items } });
        }
        setMediaReady(true);
      })
      .catch(() => {
        mediaLoadedRef.current = true; // IndexedDB unavailable, allow saves anyway
        setMediaReady(true);
      });
  }, []);

  // Save to localStorage (without dataUrls) + IndexedDB (with dataUrls) on every change
  useEffect(() => {
    // localStorage: strip dataUrls to stay within quota
    try {
      const toStore = {
        ...areal,
        media: areal.media.map(m => ({ ...m, dataUrl: '' })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.warn('Failed to save areal to localStorage:', error);
    }
    // IndexedDB: only after initial load to avoid overwriting with empty dataUrls
    if (mediaLoadedRef.current) {
      dbSaveMedia(areal.media).catch(() => { /* ignore */ });
    }
  }, [areal]);

  const updateAreal = useCallback((data: Partial<Areal>) => {
    dispatch({ type: 'UPDATE_AREAL', payload: data });
  }, []);

  const addPozemok = useCallback(() => dispatch({ type: 'ADD_POZEMOK' }), []);
  const updatePozemok = useCallback((index: number, data: Partial<Pozemok>) => {
    dispatch({ type: 'UPDATE_POZEMOK', payload: { index, data } });
  }, []);
  const removePozemok = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_POZEMOK', payload: index });
  }, []);

  const addBudova = useCallback(() => dispatch({ type: 'ADD_BUDOVA' }), []);
  const updateBudova = useCallback((index: number, data: Partial<Budova>) => {
    dispatch({ type: 'UPDATE_BUDOVA', payload: { index, data } });
  }, []);
  const removeBudova = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_BUDOVA', payload: index });
  }, []);

  const addInaStavba = useCallback(() => dispatch({ type: 'ADD_INA_STAVBA' }), []);
  const updateInaStavba = useCallback((index: number, data: Partial<InaStavba>) => {
    dispatch({ type: 'UPDATE_INA_STAVBA', payload: { index, data } });
  }, []);
  const removeInaStavba = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_INA_STAVBA', payload: index });
  }, []);

  const addBGOpatrenie = useCallback(() => dispatch({ type: 'ADD_BG_OPATRENIE' }), []);
  const updateBGOpatrenie = useCallback((index: number, data: Partial<BGOpatrenie>) => {
    dispatch({ type: 'UPDATE_BG_OPATRENIE', payload: { index, data } });
  }, []);
  const removeBGOpatrenie = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_BG_OPATRENIE', payload: index });
  }, []);

  const addMedia = useCallback((item: MediaItem) => {
    dispatch({ type: 'ADD_MEDIA', payload: item });
  }, []);
  const updateMedia = useCallback((id: string, data: Partial<MediaItem>) => {
    dispatch({ type: 'UPDATE_MEDIA', payload: { id, data } });
  }, []);
  const removeMedia = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MEDIA', payload: id });
  }, []);

  const updateVahy = useCallback((data: Partial<ScoringWeights>) => {
    dispatch({ type: 'UPDATE_VAHY', payload: data });
  }, []);

  // Nový prázdny areál — baseline nastavíme na presne ten objekt, ktorý
  // vkladáme do stavu (createEmptyAreal generuje náhodné id, preto ho nesmieme
  // generovať druhýkrát pre porovnanie). Po resete je stav „čistý".
  const resetAreal = useCallback(() => {
    const empty = createEmptyAreal();
    dispatch({ type: 'SET_AREAL', payload: empty });
    setBaseline(serializeForCompare(empty));
  }, []);

  // Načítanie / import relácie — nový stav je hneď považovaný za „čistý".
  const setAreal = useCallback((a: Areal) => {
    dispatch({ type: 'SET_AREAL', payload: a });
    setBaseline(serializeForCompare(a));
  }, []);

  // Označí aktuálny stav za uložený (volá sa po uložení relácie).
  const markSaved = useCallback(() => {
    setBaseline(serializeForCompare(areal));
  }, [areal]);

  return {
    areal,
    mediaReady,
    isDirty,
    markSaved,
    updateAreal,
    addPozemok, updatePozemok, removePozemok,
    addBudova, updateBudova, removeBudova,
    addInaStavba, updateInaStavba, removeInaStavba,
    addBGOpatrenie, updateBGOpatrenie, removeBGOpatrenie,
    addMedia, updateMedia, removeMedia,
    updateVahy,
    resetAreal,
    setAreal,
  };
}
