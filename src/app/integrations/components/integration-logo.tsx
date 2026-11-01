import Image from 'next/image';
import type { IntegrationDefinition } from '../catalog';

/** The brand logo when one is hosted, otherwise a tile with the brand colour and initials. */
export default function IntegrationLogo({ integration }: { integration: IntegrationDefinition }) {
  if (integration.logoUrl) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-white p-1.5">
        <Image src={integration.logoUrl} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
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
