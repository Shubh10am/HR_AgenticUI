'use client';

import { useEffect } from 'react';

/** Registers the service worker in production so the app can be installed on a phone or desktop. */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker registration failed', error));
  }, []);
  return null;
}
