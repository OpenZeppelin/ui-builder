/// <reference types="vite/client" />

// Add type declarations for Vite's `?raw` imports
declare module '*?raw' {
  const content: string;
  export default content;
}
