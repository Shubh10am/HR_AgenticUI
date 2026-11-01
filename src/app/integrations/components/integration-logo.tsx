'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { IntegrationDefinition } from '../catalog';

const tile = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white p-2';

/**
 * The brand logo: a hosted image, else the Simple Icons logo in the brand colour,
 * else (if neither loads) a tile with the brand colour and initials.
 */
export default function IntegrationLogo({ integration }: { integration: IntegrationDefinition }) {
  const [failed, setFailed] = useState(false);

  if (integration.logoUrl) {
    return (
      <span className={tile}>
        <Image src={integration.logoUrl} alt="" width={32} height={32} className="h-7 w-7 object-contain" />
      </span>
    );
  }
  if (integration.iconSlug && !failed) {
    return (
      <span className={tile}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote SVG; next/image would need SVG enabled globally */}
        <img src={`https://cdn.simpleicons.org/${integration.iconSlug}`} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 object-contain" onError={() => setFailed(true)} />
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
