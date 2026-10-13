import { describe, it, expect } from 'vitest';
import { hodinyPrevadzkyZaRok, upozorneniePoctuDni } from '../vyuzitieObjektu';

const v = (dni: number, mes: number, hod: number) => ({
  vyuzitieDniVRoku: dni, vyuzitieMesiacovVRoku: mes, vyuzitieHodinDenne: hod,
});

describe('hodinyPrevadzkyZaRok', () => {
  it('vynásobí dni a hodiny denne', () => expect(hodinyPrevadzkyZaRok(v(200, 10, 10))).toBe(2000));
  it('bez údajov vráti undefined', () => expect(hodinyPrevadzkyZaRok(v(0, 12, 8))).toBeUndefined());
});

describe('upozorneniePoctuDni', () => {
  it('celý rok (365 dní, 12 mesiacov) je v poriadku', () => expect(upozorneniePoctuDni(v(365, 12, 8))).toBeUndefined());
  it('nevyplnené mesiace neupozorňujú', () => expect(upozorneniePoctuDni(v(365, 0, 8))).toBeUndefined());
  it('365 dní pri 6 mesiacoch upozorní', () => expect(upozorneniePoctuDni(v(365, 6, 8))).toMatch(/nezmestí/));
  it('186 dní pri 6 mesiacoch je ešte v poriadku', () => expect(upozorneniePoctuDni(v(186, 6, 8))).toBeUndefined());
  it('1 mesiac skloňuje', () => expect(upozorneniePoctuDni(v(40, 1, 8))).toMatch(/1 mesiaca/));
});
