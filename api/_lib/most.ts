/**
 * Odoslanie záznamu do VESMA mostu (Google Apps Script Web App), ktorý ho
 * zapíše do Google Sheetu. Spoločné pre podnety, nezodpovedané otázky
 * a registrácie používateľov.
 *
 * POZOR: na poradí kľúčov v `payload` záleží — most zapisuje hodnoty do hárku
 * v poradí, v akom prídu (kľúče `secret` a `action` preskočí).
 */
export async function posliNaMost(
  payload: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const WEBAPP_URL = process.env.SHEET_WEBAPP_URL ?? '';
  const WEBHOOK_SECRET = process.env.SHEET_WEBHOOK_SECRET ?? '';
  if (!WEBAPP_URL || !WEBHOOK_SECRET) {
    return { ok: false, status: 503, error: 'Backend nie je nakonfigurovaný.' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const resp = await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: WEBHOOK_SECRET, ...payload }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return { ok: false, status: 502, error: `VESMA most vrátil ${resp.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, status: 502, error: err instanceof Error ? err.message : 'Neznáma chyba' };
  }
}
