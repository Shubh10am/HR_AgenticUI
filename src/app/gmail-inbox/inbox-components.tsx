'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format, isToday, isThisYear } from 'date-fns';
import { Check, Copy, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Email {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  date?: string;
  to?: string;
  category?: string;
}

const AVATAR_TINTS = [
  'bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500',
];

/** Splits `Name <address>` into its parts; falls back to the raw value. */
export function parseSender(raw: string): { name: string; address: string } {
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || match[2], address: match[2] };
  return { name: raw.trim(), address: raw.trim() };
}

export function formatEmailDate(date?: string, long = false): string {
  if (!date) return '';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  if (long) return format(value, "EEE, MMM d, yyyy 'at' h:mm a");
  if (isToday(value)) return format(value, 'h:mm a');
  return format(value, isThisYear(value) ? 'MMM d' : 'MMM d, yyyy');
}

// A message is treated as a one-time-code email only when it says so in plain
// words: "verification code", "OTP", "passcode", "your code is" and the like.
// A bare "code" is not enough ("promo code", "Indian Penal Code 1860").
const OTP_KEYWORD =
  /\b(?:otp|passcode|one[- ]time (?:password|passcode|code|pin)|(?:verification|security|login|sign[- ]?in|confirmation|authentication|access|2fa|two[- ]factor) code|your code(?: is)?|code is)\b/i;
const CODE_AFTER_KEYWORD = new RegExp(
  `${OTP_KEYWORD.source}[\\s:=\\-–]*(?:is[\\s:]*)?(?<![\\w@./-])(\\d{4,8}|\\d{3}[- ]\\d{3})(?![\\w@./%-])`,
  'i'
);
const PROMOTIONAL = /\b(?:coupon|promo(?:tional)?|discount|voucher|offer|sale|% off|cashback)\b/i;
const BODY_SCAN_LENGTH = 600;

const LOOKS_LIKE_YEAR = /^(18|19|20)\d{2}$/;

function toPlainText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\S+@\S+/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Finds a one-time code the way Gmail's "Copy code" chip does. The subject or
 * opening text must call it a verification code / OTP, the number must follow
 * that phrase closely, and promotional mail is skipped entirely.
 */
export function detectVerificationCode(email: Email): string | null {
  const opening = toPlainText(email.body).slice(0, BODY_SCAN_LENGTH);
  if (PROMOTIONAL.test(`${email.subject} ${email.snippet}`)) return null;
  if (!OTP_KEYWORD.test(`${email.subject} ${email.snippet} ${opening}`)) return null;
  for (const source of [email.subject, email.snippet, opening]) {
    const match = source.match(CODE_AFTER_KEYWORD);
    if (!match) continue;
    const code = match[1].replace(/[- ]/g, '');
    // A bare 4-digit year ("Updated Nov 01, 2026") is not a code.
    if (!LOOKS_LIKE_YEAR.test(code)) return code;
  }
  return null;
}

export function SenderAvatar({ name, className }: { name: string; className?: string }) {
  const initial = name.replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || '?';
  const tint = AVATAR_TINTS[initial.charCodeAt(0) % AVATAR_TINTS.length];
  return (
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white', tint, className)}>
      {initial}
    </span>
  );
}

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: (email: Email) => void;
  /** Shows the "AI reply" cue; omitted for mailboxes where replying makes no sense. */
  onAiReply?: (email: Email) => void;
}

export function EmailListItem({ email, isSelected, onSelect, onAiReply }: EmailListItemProps) {
  const sender = parseSender(email.from || email.to || '');
  const code = detectVerificationCode(email);
  const canAiReply = Boolean(onAiReply) && !code;
  return (
    <div className={cn('group relative border-b border-border/60 transition-colors', isSelected ? 'bg-primary/[0.07]' : 'hover:bg-secondary/70')}>
      {isSelected && <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}
      <button
        type="button"
        id={`gmail-email-${email.id}`}
        onClick={() => onSelect(email)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <SenderAvatar name={sender.name} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{sender.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatEmailDate(email.date)}</span>
          </span>
          <span className="mt-0.5 block truncate text-sm text-foreground/90">{email.subject || '(no subject)'}</span>
          <span className={cn('mt-0.5 block truncate text-xs text-muted-foreground', canAiReply && 'pr-24')}>{email.snippet}</span>
          {code && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <ShieldCheck className="h-3 w-3" /> Code {code}
            </span>
          )}
        </span>
      </button>
      {canAiReply && (
        <button
          type="button"
          id={`gmail-email-${email.id}-ai-reply`}
          onClick={() => onAiReply?.(email)}
          aria-label={`Reply to ${sender.name} with AI`}
          className={cn(
            'absolute bottom-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-1 text-[11px] font-semibold text-white shadow-md shadow-primary/30 transition-all',
            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
            isSelected && 'opacity-100'
          )}
        >
          <Sparkles className="h-3 w-3" /> AI reply
        </button>
      )}
    </div>
  );
}

export function AiTipBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div id="gmail-ai-tip" className="flex items-start gap-3 border-b bg-gradient-to-r from-primary/[0.08] to-accent/[0.08] px-4 py-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <p className="flex-1 text-xs leading-relaxed text-foreground/80">
        <span className="font-semibold text-foreground">Reply with AI.</span> Hover any email and press <span className="font-semibold text-primary">AI reply</span> to get drafts in seconds.
      </p>
      <button type="button" id="gmail-ai-tip-dismiss" onClick={onDismiss} aria-label="Dismiss tip" className="rounded-md p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function VerificationCodeCard({ code }: { code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div id="gmail-verification-code" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] to-accent/[0.06] px-5 py-4">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Verification code</p>
          <p className="font-mono text-2xl font-bold tracking-[0.3em] text-foreground">{code}</p>
        </div>
      </div>
      <Button id="gmail-verification-code-copy" onClick={handleCopy} variant={isCopied ? 'secondary' : 'default'} className="rounded-full">
        {isCopied ? <Check /> : <Copy />}
        {isCopied ? 'Copied' : 'Copy code'}
      </Button>
    </div>
  );
}

const EMAIL_FRAME_BASE_STYLES = `
  html, body { margin: 0; padding: 0; background: transparent; }
  body { font-family: Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #1f2433; overflow-wrap: anywhere; }
  img, video { max-width: 100% !important; height: auto !important; }
  table { max-width: 100% !important; }
  pre { white-space: pre-wrap; }
  a { color: #4f46e5; }
`;

/**
 * Renders email HTML in a sandboxed iframe, as Gmail does, so the email's own
 * CSS cannot leak into the app and wide layouts cannot stretch the page.
 * Scripts stay disabled; the frame grows to fit its content.
 */
export function EmailBodyFrame({ html, title }: { html: string; title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  const srcDoc = useMemo(
    () => `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>${EMAIL_FRAME_BASE_STYLES}</style></head><body>${html}</body></html>`,
    [html]
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let observer: ResizeObserver | null = null;

    // Fixed-width newsletters (often 600px) are scaled down to the pane, as Gmail does.
    const fit = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      doc.body.style.zoom = '1';
      const contentWidth = doc.documentElement.scrollWidth;
      const scale = contentWidth > frame.clientWidth ? frame.clientWidth / contentWidth : 1;
      doc.body.style.zoom = String(scale);
      setHeight(Math.ceil(doc.documentElement.scrollHeight));
    };
    const handleLoad = () => {
      fit();
      frame.contentDocument?.querySelectorAll('img').forEach((img) => img.addEventListener('load', fit, { once: true }));
      observer = new ResizeObserver(fit);
      observer.observe(frame);
    };

    frame.addEventListener('load', handleLoad);
    return () => {
      frame.removeEventListener('load', handleLoad);
      observer?.disconnect();
    };
  }, [srcDoc]);

  return (
    <iframe
      ref={frameRef}
      id="gmail-email-body"
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="block w-full border-0"
      style={{ height }}
    />
  );
}
