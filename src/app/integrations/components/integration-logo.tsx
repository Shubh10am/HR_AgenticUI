'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { IntegrationDefinition } from '../catalog';

const tile = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white p-2';

/**
 * The brand logo: a hosted image, else the Simple Icons logo, else the company's
 * site icon, else (if none loads) a tile with the brand colour and initials.
 */
export default function IntegrationLogo({ integration }: { integration: IntegrationDefinition }) {
  // Try each source in turn: Simple Icons, then the company's site icon, then initials.
  const sources = [
    integration.iconSlug && !integration.domain ? `https://cdn.simpleicons.org/${integration.iconSlug}` : null,
    integration.domain ? `https://www.google.com/s2/favicons?domain=${integration.domain}&sz=64` : null,
  ].filter((src): src is string => Boolean(src));
  const [attempt, setAttempt] = useState(0);

  if (integration.logoUrl) {
    return (
      <span className={tile}>
        <Image src={integration.logoUrl} alt="" width={32} height={32} className="h-7 w-7 object-contain" />
      </span>
    );
  }
  if (attempt < sources.length) {
    return (
      <span className={tile}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG/ICO; next/image would need SVG enabled globally */}
        <img key={sources[attempt]} src={sources[attempt]} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 object-contain" onError={() => setAttempt((n) => n + 1)} />
      </span>
    );
  }
  const initials = integration.name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: integration.color }}>
      {initials}
    </span>
  );
}
