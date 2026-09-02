import { useCallback, useState } from 'react';
import { AKTUALNA_VERZIA_SCHEMY, Areal } from '../types/areal';
import { buildShareMailto, sessionJsonFilename } from '../utils/shareSession';
import { migrateAreal } from './useArealState';
import { chybajuceNovePolia, verziaArealu } from '../utils/schemaVersion';

/**
 * Verzia schémy, s ktorou sa relácia uloží (issue #177). Na aktuálnu sa posunie až
 * vtedy, keď sú nové polia doplnené — inak by pripomienka po ďalšom načítaní zmizla,
 * hoci polia ostávajú na „neviem".
 */
function verziaPreUlozenie(areal: Areal): number {
  return chybajuceNovePolia(areal).length === 0 ? AKTUALNA_VERZIA_SCHEMY : verziaArealu(areal);
}

export interface Session {
  id: string;
  nazov: string;
  areal: Areal;
  datumUlozenia: string;
}

const SESSIONS_KEY = 'sma-nastroj-sessions';

/**
 * Nájde uložené relácie, ktoré zodpovedajú rovnakému areálu ako ten, čo sa
 * práve ukladá — podľa ID areálu (rovnaká otvorená relácia), alebo zhody
 * názvu, alebo adresy areálu (issue #161). Zoradené od najnovšie uloženej.
 */
export function findMatchingSessions(sessions: Session[], areal: Areal): Session[] {
  const nazov = areal.nazov.trim().toLowerCase();
  const adresa = areal.adresa.trim().toLowerCase();
  return sessions
    .filter((s) => {
      if (areal.id && s.areal.id === areal.id) return true;
      if (nazov && s.areal.nazov.trim().toLowerCase() === nazov) return true;
      if (adresa && s.areal.adresa.trim().toLowerCase() === adresa) return true;
      return false;
    })
    .sort((a, b) => new Date(b.datumUlozenia).getTime() - new Date(a.datumUlozenia).getTime());
}

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]): void {
  try {
    // Ukladáme bez media base64 dat aby sme šetrili miesto — len metadata
    const light = sessions.map((s) => ({
      ...s,
      areal: {
        ...s.areal,
        media: s.areal.media.map((m) => ({
          ...m,
          dataUrl: m.typ === 'foto' ? m.dataUrl : '', // video blobs nie sú persistovateľné
        })),
      },
    }));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(light));
  } catch (e) {
    console.warn('Nepodarilo sa uložiť relácie:', e);
  }
}

export function useSessionManager() {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());

  const saveSession = useCallback((nazov: string, areal: Areal): Session => {
    const session: Session = {
      id: crypto.randomUUID(),
      nazov,
      areal: {
        ...areal,
        id: areal.id || crypto.randomUUID(),
        schemaVersion: verziaPreUlozenie(areal),
      },
      datumUlozenia: new Date().toISOString(),
    };
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
    return session;
  }, []);

  const updateSession = useCallback((id: string, nazov: string, areal: Areal) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === id
          ? {
            ...s,
            nazov,
            areal: { ...areal, schemaVersion: verziaPreUlozenie(areal) },
            datumUlozenia: new Date().toISOString(),
          }
          : s
      );
      saveSessions(updated);
      return updated;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
  }, []);

  const exportSession = useCallback((session: Session) => {
    const json = JSON.stringify(session, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sessionJsonFilename(session.nazov, session.id);
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Zdieľanie relácie (variant A): stiahne JSON v nezmenenom formáte a otvorí
  // e-mailového klienta s predvyplneným predmetom a telom. Prílohu pridá používateľ ručne.
  const shareSession = useCallback((session: Session) => {
    exportSession(session);
    const filename = sessionJsonFilename(session.nazov, session.id);
    window.location.href = buildShareMailto(session.nazov, filename);
  }, [exportSession]);

  const importSession = useCallback((file: File): Promise<Areal> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          // Môže byť celá Session alebo iba Areal. migrateAreal doplní chýbajúce polia
          // aj verziu schémy (issue #177), takže importovaná staršia relácia dostane
          // rovnakú pripomienku ako uložená.
          resolve(migrateAreal(data.areal ?? data));
        } catch {
          reject(new Error('Neplatný súbor relácie'));
        }
      };
      reader.onerror = () => reject(new Error('Chyba čítania súboru'));
      reader.readAsText(file);
    });
  }, []);

  return { sessions, saveSession, updateSession, deleteSession, exportSession, shareSession, importSession };
}
