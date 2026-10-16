import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Film, Trash2, Upload, AlertCircle, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { MediaItem } from '../../types/areal';
import { textPotvrdeniaMazania } from '../../utils/vyplnenyObsah';

const MAX_FOTO_SIZE_MB = 20;
const MAX_VIDEO_SIZE_MB = 50;
const COMPRESS_MAX_PX = 1400;
const COMPRESS_QUALITY = 0.82;

interface MediaUploadProps {
  media: MediaItem[];
  onAdd: (item: MediaItem) => void;
  onUpdate: (id: string, data: Partial<MediaItem>) => void;
  onRemove: (id: string) => void;
  mediaReady?: boolean;
}

export function MediaUpload({ media, onAdd, onUpdate, onRemove, mediaReady = true }: MediaUploadProps) {
  const fotoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [chyba, setChyba] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Only photos can be opened in lightbox
  const fotoItems = media.filter(m => m.typ === 'foto' && m.dataUrl);

  const openLightbox = useCallback((item: MediaItem) => {
    const idx = fotoItems.findIndex(f => f.id === item.id);
    if (idx !== -1) setLightboxIndex(idx);
  }, [fotoItems]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prevPhoto = useCallback(() => {
    setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const nextPhoto = useCallback(() => {
    setLightboxIndex(i => (i !== null && i < fotoItems.length - 1 ? i + 1 : i));
  }, [fotoItems.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, closeLightbox, prevPhoto, nextPhoto]);

  const spracujSubory = async (files: FileList | null) => {
    if (!files) return;
    setChyba(null);
    setLoading(true);

    for (const file of Array.from(files)) {
      const jeVideo = file.type.startsWith('video/');
      const jeFoto = file.type.startsWith('image/');

      if (!jeFoto && !jeVideo) {
        setChyba(`Nepodporovaný formát: ${file.name}`);
        continue;
      }

      const maxMB = jeVideo ? MAX_VIDEO_SIZE_MB : MAX_FOTO_SIZE_MB;
      if (file.size > maxMB * 1024 * 1024) {
        setChyba(`${file.name} prekračuje limit ${maxMB} MB`);
        continue;
      }

      if (jeFoto) {
        const dataUrl = await compressImage(file);
        const compressedSize = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
        onAdd({
          id: crypto.randomUUID(),
          nazov: file.name,
          typ: 'foto',
          dataUrl,
          velkost: compressedSize,
          popis: '',
          datumNahratia: new Date().toISOString(),
        });
      } else {
        onAdd({
          id: crypto.randomUUID(),
          nazov: file.name,
          typ: 'video',
          dataUrl: '',
          velkost: file.size,
          popis: '',
          datumNahratia: new Date().toISOString(),
        });
      }
    }

    setLoading(false);
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > COMPRESS_MAX_PX || height > COMPRESS_MAX_PX) {
            if (width >= height) {
              height = Math.round((height / width) * COMPRESS_MAX_PX);
              width = COMPRESS_MAX_PX;
            } else {
              width = Math.round((width / height) * COMPRESS_MAX_PX);
              height = COMPRESS_MAX_PX;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', COMPRESS_QUALITY));
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    spracujSubory(e.dataTransfer.files);
  };

  const formatVelkost = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const lightboxItem = lightboxIndex !== null ? fotoItems[lightboxIndex] : null;

  return (
    <div className="space-y-4">
      {/* Drop zóna */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#52A8DE] transition-colors"
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 font-medium">Pretiahnite súbory sem alebo</p>
        <div className="flex justify-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => fotoRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-ink border border-[#52A8DE] rounded-xl hover:bg-[#52A8DE]/5"
          >
            <Camera className="w-3.5 h-3.5" />
            Pridať foto
          </button>
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-400 rounded-xl hover:bg-blue-50"
          >
            <Film className="w-3.5 h-3.5" />
            Pridať video
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Foto: max {MAX_FOTO_SIZE_MB} MB (automaticky skomprimované) · Video: max {MAX_VIDEO_SIZE_MB} MB (iba metadáta)
        </p>
        <input ref={fotoRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => spracujSubory(e.target.files)} />
        <input ref={videoRef} type="file" accept="video/*" multiple className="hidden"
          onChange={(e) => spracujSubory(e.target.files)} />
      </div>

      {chyba && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {chyba}
        </div>
      )}

      {loading && (
        <p className="text-xs text-gray-500 text-center">Spracovávam súbory…</p>
      )}

      {/* Galéria */}
      {media.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Nahraté médiá ({media.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                mediaReady={mediaReady}
                onPopis={(popis) => onUpdate(item.id, { popis })}
                onRemove={() => {
                  if (confirm(textPotvrdeniaMazania(item.typ === 'foto' ? 'fotku' : 'súbor', item.nazov))) onRemove(item.id);
                }}
                onExpand={() => openLightbox(item)}
                formatVelkost={formatVelkost}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Zatvoriť */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Počítadlo */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {(lightboxIndex ?? 0) + 1} / {fotoItems.length}
          </div>

          {/* Predchádzajúca */}
          {(lightboxIndex ?? 0) > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Obrázok */}
          <img
            src={lightboxItem.dataUrl}
            alt={lightboxItem.nazov}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Nasledujúca */}
          {(lightboxIndex ?? 0) < fotoItems.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Popis */}
          {lightboxItem.popis && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full max-w-sm text-center">
              {lightboxItem.popis}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  item,
  mediaReady,
  onPopis,
  onRemove,
  onExpand,
  formatVelkost,
}: {
  item: MediaItem;
  mediaReady: boolean;
  onPopis: (p: string) => void;
  onRemove: () => void;
  onExpand: () => void;
  formatVelkost: (b: number) => string;
}) {
  const canExpand = item.typ === 'foto' && !!item.dataUrl;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden group">
      {/* Náhľad */}
      <div
        className={`relative bg-gray-100 h-28 flex items-center justify-center ${canExpand ? 'cursor-zoom-in' : ''}`}
        onClick={canExpand ? onExpand : undefined}
      >
        {item.typ === 'foto' && item.dataUrl ? (
          <>
            <img
              src={item.dataUrl}
              alt={item.nazov}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
          </>
        ) : item.typ === 'foto' && !mediaReady ? (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Camera className="w-8 h-8 animate-pulse" />
            <span className="text-xs">načítava sa…</span>
          </div>
        ) : item.typ === 'foto' ? (
          <div className="flex flex-col items-center gap-1 text-red-700">
            <Camera className="w-8 h-8" />
            <span className="text-xs text-center px-1">foto sa stratilo<br />nahraj znovu</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Film className="w-8 h-8" />
            <span className="text-xs">video</span>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 p-1 rounded-full bg-surface/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="p-2 space-y-1">
        <p className="text-xs font-medium text-gray-700 truncate" title={item.nazov}>
          {item.nazov}
        </p>
        <p className="text-xs text-gray-400">{formatVelkost(item.velkost)}</p>
        <input
          type="text"
          value={item.popis}
          onChange={(e) => onPopis(e.target.value)}
          placeholder="Popis…"
          className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:border-[#52A8DE]"
        />
      </div>
    </div>
  );
}
