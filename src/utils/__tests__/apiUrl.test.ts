import { describe, it, expect } from 'vitest';
import { apiUrl } from '../apiUrl';

describe('apiUrl', () => {
  it('pridá základnú cestu nasadenia pred /api/', () => {
    expect(apiUrl('feedback', '/vesma/')).toBe('/vesma/api/feedback');
  });

  it('funguje aj pri nasadení v koreni', () => {
    expect(apiUrl('feedback', '/')).toBe('/api/feedback');
  });

  it('doplní chýbajúcu koncovú lomku základnej cesty', () => {
    expect(apiUrl('pvgis', '/vesma')).toBe('/vesma/api/pvgis');
  });

  it('zachová parametre dopytu', () => {
    expect(apiUrl('svp-flood?lat=49&lon=19', '/vesma/')).toBe('/vesma/api/svp-flood?lat=49&lon=19');
  });

  it('nezdvojí lomku, keď cesta začína lomkou', () => {
    expect(apiUrl('/feedback', '/vesma/')).toBe('/vesma/api/feedback');
  });
});
