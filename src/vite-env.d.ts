/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VISITOR_HISTORY_WORKER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
