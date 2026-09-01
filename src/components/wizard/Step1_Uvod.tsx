import { useState } from 'react';
import { Building2, MapPin, Camera, ClipboardList, Globe, Loader2, Gauge } from 'lucide-react';
import { Areal, MediaItem, KategoriaObjektu, KATEGORIE_OBJEKTU, TYP_OBJEKTU_OPTIONS, FIRMA_TYPY_S_KAPACITOU } from '../../types/areal';
import { TextInput } from '../ui/TextInput';
import { NumberInput } from '../ui/NumberInput';
import { ComboboxInput } from '../ui/ComboboxInput';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { MediaUpload } from '../media/MediaUpload';
import { KRAJE, OKRESY_BY_KRAJ, OBCE_SR } from '../../data/slovakLocations';
import { matchKraj, matchOkres } from '../../utils/locationMatchers';
import { apiUrl } from '../../utils/apiUrl';

interface Step1Props {
  areal: Areal;
  updateAreal: (data: Partial<Areal>) => void;
  addMedia: (item: MediaItem) => void;
  updateMedia: (id: string, data: Partial<MediaItem>) => void;
  removeMedia: (id: string) => void;
  mediaReady: boolean;
}


async function fetchKlimatickeUdaje(
  adresa: string,
  obec: string,
  onStatus: (msg: string) => void,
): Promise<{ zrazky: number; solar: number; kraj: string; okres: string } | null> {
  const query = [adresa, obec, 'Slovensko'].filter(Boolean).join(', ');

  // 1. Geocoding
  onStatus('Hľadám polohu adresy…');
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
    { headers: { 'Accept-Language': 'sk' } }
  );
  if (!geoRes.ok) throw new Error(`Geocoding zlyhal (${geoRes.status})`);
  const geoData = await geoRes.json();
  if (!geoData.length) return null;
  const lat = parseFloat(geoData[0].lat);
  const lon = parseFloat(geoData[0].lon);

  // Extract kraj + okres from address details
  const addr = geoData[0].address ?? {};
  const krajMatched = matchKraj(addr.state ?? '');
  const okresMatched = matchOkres(addr.county ?? addr.state_district ?? '', krajMatched);

  // 2. Zrážky – Open-Meteo (priemer posledných 5 rokov)
  onStatus('Načítavam zrážkové dáta…');
  const rok = new Date().getFullYear();
  const precipRes = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${rok - 6}-01-01&end_date=${rok - 1}-12-31` +
    `&daily=precipitation_sum&timezone=Europe%2FBerlin`
  );
  if (!precipRes.ok) throw new Error(`Open-Meteo zlyhal (${precipRes.status})`);
  const precipData = await precipRes.json();
  if (precipData.error) throw new Error(`Open-Meteo: ${precipData.reason ?? 'neznáma chyba'}`);
  const sums: number[] = precipData.daily?.precipitation_sum ?? [];
  const zrazky = sums.length > 0
    ? Math.round(sums.reduce((a, b) => a + (b ?? 0), 0) / 5)
    : 0;

  // 3. Slnečný svit – PVGIS cez server proxy (CORS)
  onStatus('Načítavam dáta slnečného svitu…');
  const pvRes = await fetch(apiUrl(`pvgis?lat=${lat}&lon=${lon}`));
  if (!pvRes.ok) throw new Error(`PVGIS zlyhal (${pvRes.status})`);
  const pvData = await pvRes.json() as { solar?: number; error?: string };
  if (pvData.error) throw new Error(`PVGIS: ${pvData.error}`);
  const solar = pvData.solar ?? 0;

  return { zrazky, solar, kraj: krajMatched, okres: okresMatched };
}

const selectClasses =
  'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none';

export function Step1_Uvod({ areal, updateAreal, addMedia, updateMedia, removeMedia, mediaReady }: Step1Props) {
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [fetchOk, setFetchOk] = useState(false);

  const okresy = areal.kraj ? (OKRESY_BY_KRAJ[areal.kraj] ?? []) : [];

  // Derive countryCode for Photon API
  const photonCountryCode =
    areal.krajina === 'Slovensko' ? 'sk' :
    areal.krajina === 'Česká republika' ? 'cz' :
    '';

  const isSlovak = areal.krajina === 'Slovensko';
  const isCzech = areal.krajina === 'Česká republika';

  const kat = areal.kategoriaObjektu;
  const showOrganizacia = kat !== 'sukromne';
  const showKapacita =
    kat !== 'sukromne' &&
    (kat !== 'firma' || FIRMA_TYPY_S_KAPACITOU.includes(areal.typObjektu as typeof FIRMA_TYPY_S_KAPACITOU[number]));
  const showZamestnanci = kat !== 'sukromne';
  const organizaciaLabel = kat === 'firma' ? 'Prevádzkovateľ' : 'Organizácia (zriaďovateľská pôsobnosť)';
  const organizaciaPlaceholder = kat === 'firma' ? 'napr. ABC s.r.o.' : 'napr. Žilinský samosprávny kraj';
  const typOptions = kat ? TYP_OBJEKTU_OPTIONS[kat] : [];

  const handleAddressSelect = (result: { ulica: string; obec: string; okres: string; kraj: string }) => {
    const update: Partial<Areal> = { adresa: result.ulica };
    if (result.obec) update.obec = result.obec;
    if (isSlovak) {
      if (result.kraj) { update.kraj = result.kraj; update.okres = result.okres || ''; }
      else if (result.okres) update.okres = result.okres;
    } else {
      // For CZ just fill obec/okres/kraj as free text
      if (result.obec) update.obec = result.obec;
      if (result.okres) update.okres = result.okres;
      if (result.kraj) update.kraj = result.kraj;
    }
    updateAreal(update);
  };

  const handleFetchKlima = async () => {
    setFetchLoading(true);
    setFetchError('');
    setFetchOk(false);
    setFetchStatus('');
    try {
      const res = await fetchKlimatickeUdaje(areal.adresa, areal.obec, setFetchStatus);
      if (!res) { setFetchError('Adresu sa nepodarilo nájsť. Skúste zadať obec presnejšie.'); return; }
      const update: Partial<Areal> = { mnozstvoZrazok: res.zrazky, potencialSlnecnehoSvitu: res.solar };
      if (res.kraj) { update.kraj = res.kraj; update.okres = res.okres || ''; }
      updateAreal(update);
      setFetchOk(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Neznáma chyba';
      setFetchError(msg);
    } finally {
      setFetchLoading(false);
      setFetchStatus('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="space-y-2 pb-4 border-b border-gray-100">
        <div className="flex justify-end">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <img
              src={`${import.meta.env.BASE_URL}INOVIA_Logo_Final_RGB.jpg`}
              alt="INOVIA"
              className="w-4 h-4 rounded-full object-cover object-left"
            />
            <span>V spolupráci s INOVIA</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 bg-[#52A8DE]/10 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-[#52A8DE]" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FBBB4B]" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Identifikácia areálu</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Zadajte základné údaje o areáli, ktorý chcete vyhodnotiť.
            Areál je súvislé územie s pozemkami a budovami, ktoré patria k sebe.
          </p>
        </div>
      </div>

      {/* Presné hodnoty vs. odhady */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Gauge className="w-5 h-5 text-[#2196F3] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-1">
          <p className="font-semibold">Presné hodnoty vs. odhady</p>
          <p>
            Tam, kde viete zohnať presné dáta a fakty, vypĺňajte presné hodnoty.
            Kde ich nemáte k dispozícii, stačí odborný odhad. Čím presnejšie údaje
            zadáte, tým priliehavejší bude výsledok – zmysel má však aj vyplnenie
            iba odhadov. Je na vás, do akej presnosti chcete ísť.
          </p>
        </div>
      </div>

      {/* Workflow info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-2">Odporúčaný postup mapovania</p>
        <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
          <li>Vyplňte polia dostupné z internetu (zrážky, slnečný svit, katastrálna mapa)</li>
          <li>Uložte si rozrobený formulár pomocou tlačidla <strong>Relácie</strong> v hlavičke</li>
          <li>Choďte do terénu – robte si poznámky, fotky, videá (nahrajte ich tu dole)</li>
          <li>Po návrate otvorte uloženú reláciu a doplňte zvyšné polia</li>
        </ol>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <TextInput
          label="Názov areálu"
          value={areal.nazov}
          onChange={(v) => updateAreal({ nazov: v })}
          placeholder="napr. Základná škola Lipová"
          tooltipText="Zvoľte ľubovoľný názov, ktorý vám pomôže areál identifikovať."
        />

        {/* Kategória a typ objektu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Kategória areálu</label>
            <select
              value={areal.kategoriaObjektu ?? ''}
              onChange={(e) => updateAreal({
                kategoriaObjektu: (e.target.value as KategoriaObjektu) || undefined,
                typObjektu: undefined,
              })}
              className={selectClasses}
            >
              <option value="">– vyberte kategóriu –</option>
              {KATEGORIE_OBJEKTU.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Typ objektu</label>
            <select
              value={areal.typObjektu ?? ''}
              onChange={(e) => updateAreal({ typObjektu: e.target.value || undefined })}
              disabled={!kat}
              className={selectClasses}
            >
              <option value="">{kat ? '– vyberte typ –' : '– najprv vyberte kategóriu –'}</option>
              {typOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Krajina */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Krajina</label>
          <select
            value={areal.krajina ?? 'Slovensko'}
            onChange={(e) => updateAreal({ krajina: e.target.value })}
            className={selectClasses}
          >
            <option value="Slovensko">Slovensko</option>
            <option value="Česká republika">Česká republika</option>
            <option value="">iná krajina</option>
          </select>
        </div>

        {/* Ulica + číslo */}
        <AddressAutocomplete
          label="Ulica + číslo"
          value={areal.adresa}
          onChange={(v) => updateAreal({ adresa: v })}
          onSelect={handleAddressSelect}
          countryCode={photonCountryCode}
          placeholder="napr. Hlavná 15"
        />

        {/* Obec */}
        {isSlovak ? (
          <ComboboxInput
            label="Obec"
            value={areal.obec}
            onChange={(v) => updateAreal({ obec: v })}
            options={OBCE_SR}
            placeholder="napr. Likavka"
          />
        ) : (
          <TextInput
            label="Obec"
            value={areal.obec}
            onChange={(v) => updateAreal({ obec: v })}
            placeholder="napr. Ružomberok"
          />
        )}

        {/* Kraj + Okres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Kraj</label>
            {isSlovak ? (
              <select
                value={areal.kraj}
                onChange={(e) => updateAreal({ kraj: e.target.value, okres: '' })}
                className={selectClasses}
              >
                <option value="">– vyberte kraj –</option>
                {KRAJE.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={areal.kraj}
                onChange={(e) => updateAreal({ kraj: e.target.value })}
                placeholder={isCzech ? 'napr. Jihomoravský kraj' : 'napr. Banskobystrický kraj'}
                className={selectClasses}
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Okres</label>
            {isSlovak ? (
              <select
                value={areal.okres}
                onChange={(e) => updateAreal({ okres: e.target.value })}
                disabled={okresy.length === 0}
                className={selectClasses}
              >
                <option value="">
                  {areal.kraj ? '– vyberte okres –' : '– najprv vyberte kraj –'}
                </option>
                {okresy.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={areal.okres}
                onChange={(e) => updateAreal({ okres: e.target.value })}
                placeholder={isCzech ? 'napr. Brno-město' : 'napr. Ružomberok'}
                className={selectClasses}
              />
            )}
          </div>
        </div>

        {/* Klimatické údaje s auto-fetch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Klimatické údaje oblasti</span>
            <button
              type="button"
              onClick={handleFetchKlima}
              disabled={fetchLoading || (!areal.adresa && !areal.obec)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#52A8DE] border border-[#52A8DE] rounded-xl hover:bg-[#52A8DE]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Načíta priemerné zrážky z Open-Meteo a potenciál slnečného svitu z PVGIS podľa zadanej adresy"
            >
              {fetchLoading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Načítava…</>
                : <><Globe className="w-3 h-3" /> Načítať z webu</>}
            </button>
          </div>
          {fetchStatus && !fetchError && <p className="text-xs text-gray-500 italic">{fetchStatus}</p>}
          {fetchError && <p className="text-xs text-red-600">{fetchError}</p>}
          {fetchOk && <p className="text-xs text-green-700">✓ Údaje načítané – skontrolujte a upravte podľa potreby.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label="Množstvo zrážok v oblasti"
              value={areal.mnozstvoZrazok || 0}
              onChange={(v) => updateAreal({ mnozstvoZrazok: v })}
              unit="mm/rok"
              tooltipText="Priemerný ročný úhrn zrážok v oblasti. Načítané z Open-Meteo (priemer 5 rokov). Slovensko priemer: 600–800 mm/rok."
            />
            <NumberInput
              label="Potenciál slnečného svitu"
              value={areal.potencialSlnecnehoSvitu || 0}
              onChange={(v) => updateAreal({ potencialSlnecnehoSvitu: v })}
              unit="kWh/m²/rok"
              tooltipText="Ročný úhrn globálneho slnečného žiarenia na vodorovnú plochu. Načítané z PVGIS (JRC). Pre Slovensko typicky 1 000–1 300 kWh/m²/rok."
            />
          </div>
        </div>
      </div>

      {/* Záznam z obhliadky */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#52A8DE]" />
          <h3 className="text-sm font-semibold text-gray-800">Záznam z obhliadky</h3>
        </div>
        <div className={`grid grid-cols-1 ${showOrganizacia ? 'sm:grid-cols-2' : ''} gap-4`}>
          {showOrganizacia && (
            <TextInput
              label={organizaciaLabel}
              value={areal.organizaciaVZriadovatelskejPobnonosti}
              onChange={(v) => updateAreal({ organizaciaVZriadovatelskejPobnonosti: v })}
              placeholder={organizaciaPlaceholder}
            />
          )}
          <TextInput
            label="Obhliadku vykonal"
            value={areal.obhliadkuVykonal}
            onChange={(v) => updateAreal({ obhliadkuVykonal: v })}
            placeholder="Meno a priezvisko"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label="Dátum obhliadky"
            value={areal.datumObhliadky}
            onChange={(v) => updateAreal({ datumObhliadky: v })}
            placeholder="napr. 23.4.2026"
          />
          <TextInput
            label="Prítomné osoby"
            value={areal.pritomnePOSOBY}
            onChange={(v) => updateAreal({ pritomnePOSOBY: v })}
            placeholder="Mená účastníkov"
          />
        </div>
        {(showKapacita || showZamestnanci) && (
          <div className={`grid grid-cols-1 ${showKapacita && showZamestnanci ? 'sm:grid-cols-3' : ''} gap-4`}>
            {showKapacita && (
              <TextInput
                label="Kapacita zariadenia"
                value={areal.kapacitaZariadenia}
                onChange={(v) => updateAreal({ kapacitaZariadenia: v })}
                placeholder="napr. 450 žiakov"
                tooltipText="Maximálna kapacita zariadenia – koľko ľudí sa doň zmestí naraz najviac (žiaci, pacienti, návštevníci…)."
              />
            )}
            {showKapacita && (
              <NumberInput
                label="Aktuálna obsadenosť klientov/žiakov"
                value={areal.aktualnaObsadenost}
                onChange={(v) => updateAreal({ aktualnaObsadenost: v })}
                unit="%"
                max={100}
                tooltipText="Obsadenosť klientmi, pacientmi alebo žiakmi v čase mapovania, vyjadrená ako % z kapacity zariadenia. Ak sa obsadenosť v čase mapovania mení, uveďte priemer za príslušné obdobie. Nezahŕňa zamestnancov."
              />
            )}
            {showZamestnanci && (
              <NumberInput
                label="Počet zamestnancov"
                value={areal.pocetZamestnancov}
                onChange={(v) => updateAreal({ pocetZamestnancov: v })}
                tooltipText="Priemerný počet zamestnancov prítomných v areáli počas prevádzky. Slúži na výpočet KPI spotreby energií a vody – klienti/žiaci a zamestnanci majú spravidla rôznu spotrebu (napr. v sociálnych zariadeniach je spotreba klientov výrazne vyššia ako zamestnancov)."
              />
            )}
          </div>
        )}
      </div>

      {/* Foto a video materiál */}
      <div className="space-y-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#52A8DE]" />
          <h3 className="text-sm font-semibold text-gray-800">Foto a video materiál</h3>
          <span className="text-xs text-gray-400">(terénny prieskum)</span>
        </div>
        <p className="text-xs text-gray-500">
          Nahrajte fotky a videá z areálu. Budú priložené k výstupu a pomôžu pri vyplnení formulára.
        </p>
        <MediaUpload
          media={areal.media}
          onAdd={addMedia}
          onUpdate={updateMedia}
          onRemove={removeMedia}
          mediaReady={mediaReady}
        />
      </div>

      {/* Info box */}
      <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
        <MapPin className="w-5 h-5 text-[#2196F3] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">V ďalších krokoch budete postupne zadávať:</p>
          <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
            <li>Pozemok – nezastavané parcely, odvod vody, zeleň</li>
            <li>Budovy – strecha, voda, energia, vykurovanie</li>
            <li>Iné stavby – oplotenie, chodníky, parkoviská</li>
            <li>Zamýšľané B&amp;G opatrenia</li>
            <li>Výsledky a závery hodnotenia (krok 6)</li>
          </ul>
          <p className="mt-2 text-xs">
            Dáta sa automaticky ukladajú v prehliadači. Pre zdieľanie alebo zálohu použite
            funkciu <strong>Relácie → Uložiť</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
