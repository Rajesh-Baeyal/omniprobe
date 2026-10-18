/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_PRESET?: string
  readonly VITE_MAX_RING_BUFFER_SAMPLES?: string
  readonly VITE_SIM_TICK_HZ?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
