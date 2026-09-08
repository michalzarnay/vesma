/**
 * Uložené relácie v prehliadači — čítanie a stiahnutie do JSON.
 *
 * Relácie nie sú na serveri ani v účte: `localStorage` patrí **adrese**
 * (origin-u), na ktorej sa mapovalo. Kto mapoval na inej adrese, uvidí na
 * novej prázdny zoznam a jeho dáta ostanú tam, kde vznikli.
 *
 * Preto čítanie a stiahnutie bývajú potrebné aj mimo `useSessionManager` —
 * prihlasovacia brána appku ešte nevykreslila, ale relácie v prehliadači už
 * existujú a treba sa k nim dostať (issue #251).
 */
import { Areal } from '../types/areal';
import { sessionJsonFilename } from './shareSession';

export interface Session {
  id: string;
  nazov: string;
  areal: Areal;
  datumUlozenia: string;
}

/** Uložené relácie (Správca relácií). */
export const KLUC_RELACII = 'sma-nastroj-sessions';

/** Rozpracovaný areál — to, čo je práve otvorené v dotazníku. */
export const KLUC_AREALU = 'sma-nastroj-areal';

export function nacitajUlozeneRelacie(): Session[] {
  try {
    const raw = localStorage.getItem(KLUC_RELACII);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as Session[]) : [];
  } catch {
    return [];
  }
}

export function nacitajRozpracovanyAreal(): Areal | null {
  try {
    const raw = localStorage.getItem(KLUC_AREALU);
    if (!raw) return null;
    const data = JSON.parse(raw) as Areal | null;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

/** Stiahne reláciu ako JSON — v tvare, ktorý appka vie znova importovať. */
export function stiahniSessionAkoJson(session: Session): void {
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sessionJsonFilename(session.nazov, session.id);
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Všetko, čo sa dá z tohto prehliadača zachrániť: uložené relácie plus
 * rozpracovaný areál, ak je v ňom niečo vyplnené. Rozpracovaný areál sa balí
 * do tvaru relácie, aby sa dal importovať rovnakým tlačidlom ako ostatné.
 */
export function zalohaZPrehliadaca(): Session[] {
  const relacie = nacitajUlozeneRelacie();
  const rozpracovany = nacitajRozpracovanyAreal();
  if (!rozpracovany) return relacie;
  return [
    ...relacie,
    {
      id: rozpracovany.id || 'rozprac',
      nazov: `${rozpracovany.nazov || 'Bez názvu'} (rozpracovaný)`,
      areal: rozpracovany,
      datumUlozenia: new Date().toISOString(),
    },
  ];
}
