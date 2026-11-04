import { Fragment } from 'react';

/** Post text with line breaks kept, #hashtags as filter links and @mentions highlighted. */
export default function RichText({ text, onTag }: { text: string; onTag?: (tag: string) => void }) {
  const parts = text.split(/(#[\p{L}\p{N}_]{2,40}|@[\p{L}][\p{L}\p{N}_.-]{1,40})/gu);
  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/90">
      {parts.map((part, index) => {
        if (part.startsWith('#') && part.length > 2) {
          return (
            <button key={index} type="button" onClick={() => onTag?.(part.slice(1).toLowerCase())} className="font-medium text-primary hover:underline">
              {part}
            </button>
          );
        }
        if (part.startsWith('@') && part.length > 2) return <span key={index} className="rounded bg-primary/10 px-1 font-medium text-primary">{part}</span>;
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </p>
  );
}
