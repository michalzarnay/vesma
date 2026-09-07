import { LogOut } from 'lucide-react';
import { usePouzivatel } from '../../hooks/usePouzivatel';

/** E-mail prihláseného používateľa s odhlásením — do hlavičky. Bez prihlásenia nič. */
export function PrihlasenyPouzivatel() {
  const { pouzivatel, odhlasit } = usePouzivatel();
  if (!pouzivatel) return null;
  return (
    <button
      type="button"
      onClick={odhlasit}
      title={`Prihlásený ako ${pouzivatel.email} — kliknutím sa odhlásite`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors max-w-[12rem]"
      data-testid="prihlaseny-pouzivatel"
    >
      <span className="truncate hidden sm:inline">{pouzivatel.email}</span>
      <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="sr-only">Odhlásiť</span>
    </button>
  );
}
