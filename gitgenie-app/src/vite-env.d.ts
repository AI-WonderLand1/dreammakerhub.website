/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  aistudio?: {
    openSelectKey?: () => Promise<void>;
  };
}