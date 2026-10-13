import type { ReactNode } from 'react';

/**
 * Spoločný rámec sekcie vo Výsledkoch (podnety 139/140): výrazný nadpis s
 * oddeľovacou čiarou a voliteľným úvodným riadkom, aby bolo jasné, kde jedna
 * časť končí a ďalšia začína. Nemení správanie — len nadpis a rozostupy.
 */
export function SekciaVysledkov({ id, nadpis, uvod, children }: {
  id?: string;
  nadpis: ReactNode;
  uvod?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-4 pt-6 border-t-2 border-gray-200 scroll-mt-4">
      <header className="space-y-1">
        <h3 className="text-base font-bold text-gray-900">{nadpis}</h3>
        {uvod && <p className="text-xs text-gray-500">{uvod}</p>}
      </header>
      {children}
    </section>
  );
}
