/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'test' = testovacie nasadenie (hlavička „VESMA Test N"); inak stabilné (issue #236). */
  readonly VITE_VESMA_KANAL?: string;
  /** Adresa online Príručky; bez nej sa odkaz v hlavičke neukáže (issue #237). */
  readonly VITE_PRIRUCKA_URL?: string;
}
