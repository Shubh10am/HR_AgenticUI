import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function TextSetting({ id, label, hint, value, error, onChange, type = 'text', placeholder }: {
  id: string; label: string; hint?: string; value: string; error?: string; onChange: (value: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`} className={error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{error ?? hint}</p>
    </div>
  );
}

export function ToggleSetting({ id, label, hint, checked, onChange, children }: {
  id: string; label: string; hint: string; checked: boolean; onChange: (checked: boolean) => void; children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor={id} className="font-semibold">{label}</Label>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
      </div>
      {children}
    </div>
  );
}
