// Global type definitions

declare global {
  interface Window {
    session?: any;
  }
}

// Prevent session variable conflicts
declare const session: never;

export {};
