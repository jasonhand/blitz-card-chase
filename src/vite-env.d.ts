/// <reference types="vite/client" />

// Extend Window interface for Datadog RUM
declare global {
  interface Window {
    DD_RUM?: {
      addAction: (name: string, context?: Record<string, any>) => void;
      addError: (error: Error, context?: Record<string, any>) => void;
      init: (config: any) => void;
    };
  }
}
