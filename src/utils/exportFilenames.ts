export function csvFilename(nazov: string): string {
  return `${nazov || 'areal'}-hodnotenie.csv`;
}

export function xlsxFilename(nazov: string, isoDate: string): string {
  return `${nazov || 'areal'}-hodnotenie-${isoDate}.xlsx`;
}

export function pdfFilename(nazov: string): string {
  return `${nazov || 'areal'}-hodnotenie.pdf`;
}
