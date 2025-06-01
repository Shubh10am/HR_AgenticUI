
'use client';

import { useEffect } from 'react';

const FONT_STYLE_KEY = 'appFontStyle';
const FONT_SIZE_KEY = 'appFontSize';

const FONT_STYLE_CLASSES = ['font-style-sans', 'font-style-serif', 'font-style-mono'];
const FONT_SIZE_CLASSES = ['font-size-small', 'font-size-default', 'font-size-large'];

const applyStylesFromLocalStorage = () => {
  if (typeof window === 'undefined') return;

  const storedFontStyle = localStorage.getItem(FONT_STYLE_KEY);
  const storedFontSize = localStorage.getItem(FONT_SIZE_KEY);

  // Apply font style
  FONT_STYLE_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
  if (storedFontStyle && FONT_STYLE_CLASSES.includes(`font-style-${storedFontStyle}`)) {
    document.documentElement.classList.add(`font-style-${storedFontStyle}`);
  } else {
    document.documentElement.classList.add('font-style-sans'); // Default
  }

  // Apply font size
  FONT_SIZE_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
  if (storedFontSize && FONT_SIZE_CLASSES.includes(`font-size-${storedFontSize}`)) {
    document.documentElement.classList.add(`font-size-${storedFontSize}`);
  } else {
    document.documentElement.classList.add('font-size-default'); // Default
  }
};

export function ClientStyleApplicator() {
  useEffect(() => {
    applyStylesFromLocalStorage();

    // Optional: Listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === FONT_STYLE_KEY || event.key === FONT_SIZE_KEY) {
        applyStylesFromLocalStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, []);

  return null; // This component doesn't render anything
}
