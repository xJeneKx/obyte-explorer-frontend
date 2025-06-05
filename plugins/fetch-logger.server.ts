import { defineNuxtPlugin } from '#app';
import { createFetchWithLogger } from '~/utils/fetchLogger';

export default defineNuxtPlugin(() => {  
  const originalFetch = globalThis.$fetch;
  
  globalThis.$fetch = createFetchWithLogger(originalFetch);
  
  return {
    provide: {
      fetch: globalThis.$fetch
    }
  };
});
