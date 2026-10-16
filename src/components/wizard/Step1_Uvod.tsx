import { useState } from 'react';
import { Building2, MapPin, Camera, ClipboardList, Globe, Loader2, Info, BookOpen, FileText } from 'lucide-react';
import {
  Areal, MediaItem, KategoriaObjektu, KATEGORIE_OBJEKTU, TYP_OBJEKTU_OPTIONS, FIRMA_TYPY_S_KAPACITOU,
  ROZSAHY_MAPOVANIA, RozsahMapovania,
} from '../../types/areal';
import { SelectCard } from '../ui/SelectCard';
import { mapujeEnergiu, mapujeVodu } from '../../utils/rozsahMapovania';
import { TextInput } from '../ui/TextInput';
import { NumberInput } from '../ui/NumberInput';
import { ComboboxInput } from '../ui/ComboboxInput';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { MediaUpload } from '../media/MediaUpload';
import { KRAJE, OKRESY_BY_KRAJ, OBCE_SR } from '../../data/slovakLocations';
import { okresyObce, potrebujeVyberOkresu, predvyplnenieZObce } from '../../utils/obceSR';
import { apiUrl } from '../../utils/apiUrl';
import { NAZOV_KROKU_1 } from '../../types/wizard';
import { checklistPripravy } from '../../utils/uvodChecklist';
import { nacitajKlimatickeUdaje, klasifikujChybu, textChyby } from '../../utils/klimaUdaje';

// Rovnaký mechanizmus ako v Header.tsx: bez nastavenej URL sa odkaz nezobrazí.
const PRIRUCKA_URL: string = import.meta.env.VITE_PRIRUCKA_URL ?? '';

interface Step1Props {
  areal: Areal;
  updateAreal: (data: Partial<Areal>) => void;
  addMedia: (item: MediaItem) => void;
  updateMedia: (id: string, data: Partial<MediaItem>) => void;
  removeMedia: (id: string) => void;
  mediaReady: boolean;
}


const selectClasses =
  'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#52A8DE] focus:ring-2 focus:ring-[#52A8DE]/20 focus:outline-none';

export function Step1_Uvod({ areal, updateAreal, addMedia, updateMedia, removeMedia, mediaReady }: Step1Props) {
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [fetchOk, setFetchOk] = useState(false);
  const [fetchPodlaObce, setFetchPodlaObce] = useState(false);

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

  // Výber obce z registra predvyplní okres a kraj (podnety 99 a 100). Funkcia sa volá
  // aj pri odchode z poľa s nezmenenou obcou, preto prepisuje len po skutočnej zmene.
  const handleObecChange = (obec: string) => {
    const predvyplnenie = isSlovak
      ? predvyplnenieZObce(obec, { kraj: areal.kraj, okres: areal.okres }, obec !== areal.obec)
      : {};
    updateAreal({ obec, ...predvyplnenie });
  };

  const okresyObceVoViac = isSlovak && potrebujeVyberOkresu(areal.obec, areal.okres)
    ? okresyObce(areal.obec).map((m) => m.okres)
    : [];

  const handleFetchKlima = async () => {
    setFetchLoading(true);
    setFetchError('');
    setFetchOk(false);
    setFetchPodlaObce(false);
    setFetchStatus('');
    try {
      const res = await nacitajKlimatickeUdaje(
        { adresa: areal.adresa, obec: areal.obec, krajina: areal.krajina },
        setFetchStatus,
        undefined,
        (lat, lon) => apiUrl(`pvgis?lat=${lat}&lon=${lon}`),
      );
      setFetchPodlaObce(res.polohaPodlaObce);
      const update: Partial<Areal> = { mnozstvoZrazok: res.zrazky, potencialSlnecnehoSvitu: res.solar };
      if (res.kraj) { update.kraj = res.kraj; update.okres = res.okres || ''; }
      updateAreal(update);
      setFetchOk(true);
    } catch (err: unknown) {
      setFetchError(textChyby(klasifikujChybu(err)));
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
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
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
              <Building2 className="w-8 h-8 text-brand-strong" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FBBB4B]" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{NAZOV_KROKU_1}</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Zadajte základné údaje o areáli, ktorý chcete vyhodnotiť.
            Areál je súvislé územie s pozemkami a budovami, ktoré patria k sebe.
          </p>
        </div>
      </div>

      {/* Jedna informačná sekcia (podnety 101, 113): jeden neutrálny štýl, bez varovných farieb. */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4" aria-labelledby="uvod-priprava">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-brand-strong flex-shrink-0" />
            <h3 id="uvod-priprava" className="text-base font-bold text-gray-800">Čo si pripraviť</h3>
          </div>
          {PRIRUCKA_URL && (
            <a
              href={PRIRUCKA_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Príručka VESMA (otvorí sa v novej karte)"
              className="flex items-center gap-1.5 text-xs font-medium text-brand-strong hover:underline flex-shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Príručka
            </a>
          )}
        </div>
        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
          {checklistPripravy(areal.rozsahMapovania).map((p) => (
            <li key={p.id}>{p.text}</li>
          ))}
        </ul>
        <p className="text-xs text-gray-700">
          Všetko nemusíte mať hneď – formulár môžete rozrobiť, uložiť a doplniť neskôr.
          Povinné polia sú označené hviezdičkou <span className="text-red-600" aria-hidden="true">*</span>; ostatné sú nepovinné.
        </p>

        <div className="space-y-1 border-t border-gray-200 pt-3">
          <p className="text-xs font-semibold text-gray-800">Presné hodnoty vs. odhady</p>
          <p className="text-xs text-gray-700">
            Tam, kde viete zohnať presné dáta a fakty, vypĺňajte presné hodnoty.
            Kde ich nemáte k dispozícii, stačí odborný odhad. Čím presnejšie údaje
            zadáte, tým priliehavejší bude výsledok – zmysel má však aj vyplnenie
            iba odhadov. Je na vás, do akej presnosti chcete ísť.
          </p>
        </div>

        <div className="space-y-1 border-t border-gray-200 pt-3">
          <p className="text-xs font-semibold text-gray-800">Odporúčaný postup mapovania</p>
          <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
            <li>Vyplňte polia dostupné z internetu (zrážky, slnečný svit, katastrálna mapa)</li>
            <li>Uložte si rozrobený formulár pomocou tlačidla <strong>Relácie</strong> v hlavičke</li>
            <li>Choďte do terénu – robte si poznámky, fotky, videá (nahrajte ich tu dole)</li>
            <li>Po návrate otvorte uloženú reláciu a doplňte zvyšné polia</li>
          </ol>
        </div>
      </section>

      {/* Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-strong" />
          <h3 className="text-base font-bold text-gray-800">Základné údaje o areáli</h3>
        </div>
        <TextInput
          label="Názov areálu"
          required
          value={areal.nazov}
          onChange={(v) => updateAreal({ nazov: v })}
          placeholder="napr. Základná škola Lipová"
          tooltipText="Zvoľte ľubovoľný názov, ktorý vám pomôže areál identifikovať."
        />

        {/* Rozsah mapovania — podľa neho sa skryjú nerelevantné časti dotazníka aj hodnotenia. */}
        <SelectCard
          label="Čo chcete mapovať"
          options={ROZSAHY_MAPOVANIA}
          value={areal.rozsahMapovania}
          onChange={(v) => updateAreal({ rozsahMapovania: v as RozsahMapovania })}
          tooltipText="Vyberte, či vás zaujíma hospodárenie s vodou (modro-zelená infraštruktúra), energetika budov, alebo oboje. Časti dotazníka a hodnotenia mimo vybraného rozsahu sa skryjú; výber môžete kedykoľvek zmeniť a zadané údaje sa nestratia."
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
            onChange={handleObecChange}
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

        {okresyObceVoViac.length > 1 && (
          <p className="text-sm text-gray-600" role="status">
            Obec „{areal.obec}“ je vo viacerých okresoch ({okresyObceVoViac.join(', ')}). Vyberte nižšie okres.
          </p>
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Klimatické údaje oblasti</span>
            <button
              type="button"
              onClick={handleFetchKlima}
              disabled={fetchLoading || (!areal.adresa && !areal.obec)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-strong border border-[#52A8DE] rounded-xl hover:bg-[#52A8DE]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Načíta priemerné zrážky (Open-Meteo) a potenciál slnečného svitu (PVGIS) pre polohu určenú adresou a obcou vyššie"
            >
              {fetchLoading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Načítava…</>
                : <><Globe className="w-3 h-3" /> Načítať klimatické údaje podľa adresy</>}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Tlačidlo určí polohu podľa adresy a obce uvedených vyššie a doplní zrážky (Open-Meteo)
            a slnečné žiarenie (PVGIS). Údaje môžete aj zadať ručne.
          </p>
          {fetchStatus && !fetchError && <p className="text-xs text-gray-500 italic">{fetchStatus}</p>}
          {fetchError && <p className="text-xs text-amber-700" role="status">{fetchError}</p>}
          {fetchOk && <p className="text-xs text-green-700">✓ Údaje načítané – skontrolujte a upravte podľa potreby.{fetchPodlaObce && ' Poloha bola určená podľa obce, nie presnej adresy.'}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mapujeVodu(areal) && (
              <NumberInput
                label="Množstvo zrážok v oblasti"
                value={areal.mnozstvoZrazok || 0}
                onChange={(v) => updateAreal({ mnozstvoZrazok: v })}
                unit="mm/rok"
                tooltipText="Priemerný ročný úhrn zrážok v oblasti. Načítané z Open-Meteo (priemer 5 rokov). Slovensko priemer: 600–800 mm/rok."
              />
            )}
            {mapujeEnergiu(areal) && (
              <NumberInput
                label="Potenciál slnečného svitu"
                value={areal.potencialSlnecnehoSvitu || 0}
                onChange={(v) => updateAreal({ potencialSlnecnehoSvitu: v })}
                unit="kWh/m²/rok"
                tooltipText="Ročný úhrn globálneho slnečného žiarenia na vodorovnú plochu. Načítané z PVGIS (JRC). Pre Slovensko typicky 1 000–1 300 kWh/m²/rok."
              />
            )}
          </div>

          {/* Nemožnosť nádrže — vstup do hodnotenia akumulácie zrážkovej vody (issue #215). */}
          {mapujeVodu(areal) && (
          <div className="space-y-2 border border-gray-100 rounded-xl p-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={areal.nadrzNieJeMozna === 1}
                onChange={(e) => updateAreal({
                  nadrzNieJeMozna: e.target.checked ? 1 : 0,
                  ...(e.target.checked ? {} : { nadrzNemoznaDovod: '' }),
                })}
                className="mt-0.5 accent-[#52A8DE]"
              />
              <span className="text-sm text-gray-700">
                Akumulačnú nádrž na dažďovú vodu nie je možné na areáli inštalovať
                <span className="block text-xs text-gray-500 mt-0.5">
                  Napríklad pamiatková ochrana, žiadny priestor, vysoká hladina podzemnej vody.
                  Hodnotenie potom akumuláciu vody nezapočíta do skóre a nádrž ani neodporučí.
                </span>
              </span>
            </label>
            {areal.nadrzNieJeMozna === 1 && (
              <div>
                <TextInput
                  label="Dôvod, prečo nádrž nie je možná"
                  value={areal.nadrzNemoznaDovod}
                  onChange={(v) => updateAreal({ nadrzNemoznaDovod: v })}
                  placeholder="napr. dvor je v pamiatkovej zóne, nie je kde nádrž umiestniť"
                />
                {areal.nadrzNemoznaDovod.trim() === '' && (
                  <p className="text-xs text-amber-700 mt-1">
                    Dôvod doplňte — bez neho sa hodnotenie nedá obhájiť pred obcou.
                  </p>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Záznam z obhliadky */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-brand-strong" />
          <h3 className="text-base font-bold text-gray-800">Záznam z obhliadky</h3>
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
          <Camera className="w-4 h-4 text-brand-strong" />
          <h3 className="text-base font-bold text-gray-800">Foto a video materiál</h3>
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
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3">
        <MapPin className="w-5 h-5 text-brand-strong flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700">
          <p className="font-medium">V ďalších krokoch budete postupne zadávať:</p>
          <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
            <li>Pozemok – nezastavané parcely{mapujeVodu(areal) ? ', odvod vody, zeleň' : ''}{mapujeEnergiu(areal) ? ', plocha pre fotovoltiku' : ''}</li>
            <li>Budovy – strecha{mapujeVodu(areal) ? ', voda' : ''}{mapujeEnergiu(areal) ? ', energia, vykurovanie' : ''}</li>
            <li>Iné stavby – altánky, prístrešky a búdy bez základov{mapujeVodu(areal) ? '' : ' (týka sa vody)'}</li>
            <li>Zamýšľané B&amp;G opatrenia{mapujeVodu(areal) ? '' : ' (týka sa vody)'}</li>
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
