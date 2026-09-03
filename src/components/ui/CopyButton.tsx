import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  /** Text, ktorý sa vloží do schránky */
  text: string;
  /** Popis pre čítačku obrazovky, napr. „Kopírovať zhrnutie" */
  label: string;
}

/**
 * Skopíruje text do schránky a na dve sekundy to potvrdí fajkou.
 *
 * `navigator.clipboard` nie je dostupné v nezabezpečenom kontexte ani pri
 * odopretom povolení, preto má tichý záložný postup cez `document.execCommand`.
 * Zlyhanie kopírovania sa používateľovi nehlási chybou — text si vie označiť sám.
 */
export function CopyButton({ text, label }: CopyButtonProps) {
  const [skopirovane, setSkopirovane] = useState(false);

  async function kopiruj() {
    const ok = (await cezSchranku(text)) || zalozneKopirovanie(text);
    if (!ok) return;
    setSkopirovane(true);
    setTimeout(() => setSkopirovane(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={kopiruj}
      title={label}
      aria-label={label}
      className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-[#52A8DE] hover:bg-[#52A8DE]/10 transition-colors"
    >
      {skopirovane
        ? <Check className="w-3.5 h-3.5 text-[#2D7D46]" aria-hidden />
        : <Copy className="w-3.5 h-3.5" aria-hidden />}
    </button>
  );
}

async function cezSchranku(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function zalozneKopirovanie(text: string): boolean {
  try {
    const pole = document.createElement('textarea');
    pole.value = text;
    pole.setAttribute('readonly', '');
    pole.style.position = 'fixed';
    pole.style.opacity = '0';
    document.body.appendChild(pole);
    pole.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(pole);
    return ok;
  } catch {
    return false;
  }
}
