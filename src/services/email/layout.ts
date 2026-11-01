// Email-safe HTML: tables and inline styles only, so it renders in Gmail, Outlook and Apple Mail.
import { DEFAULT_THEME, EMAIL_THEMES } from './themes';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const FONT = "'Poppins','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const INK = '#18181B';
const MUTED = '#52525B';
const SOFT = '#A1A1AA';

function shell(appName: string, preheader: string, inner: string): string {
  const name = escapeHtml(appName);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');</style><title>${name}</title></head>
<body style="margin:0;padding:0;background:#F4F1FB;font-family:${FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F1FB;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
  <tr><td style="padding:0 4px 18px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
      <td style="width:34px;height:34px;border-radius:10px;background:#6D28D9;background-image:linear-gradient(135deg,#6D28D9,#DB2777);color:#fff;font:700 14px/34px ${FONT};text-align:center;">HR</td>
      <td style="padding-left:10px;font:700 16px ${FONT};color:${INK};letter-spacing:-0.2px;">${name}</td>
    </tr></table>
  </td></tr>
  ${inner}
  <tr><td align="center" style="padding:22px 24px 0;font:12px/1.6 ${FONT};color:${SOFT};">
    Sent with 💜 by ${name} · Your people, sorted.<br>© ${new Date().getFullYear()} ${name}
  </td></tr>
</table></td></tr></table></body></html>`;
}

function button(link: string, text: string, gradient: [string, string]): string {
  const href = escapeHtml(link);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;"><tr>
  <td align="center" bgcolor="${gradient[0]}" style="border-radius:999px;background:${gradient[0]};background-image:linear-gradient(135deg,${gradient[0]},${gradient[1]});box-shadow:0 8px 20px rgba(109,40,217,0.28);">
    <a href="${href}" target="_blank" style="display:inline-block;padding:15px 34px;font:700 15px ${FONT};color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(text)} &rarr;</a>
  </td></tr></table>
  <p style="margin:6px 0 0;font:12px/1.6 ${FONT};color:${SOFT};">Button not working? Paste this into your browser:<br><a href="${href}" style="color:#6D28D9;word-break:break-all;">${href}</a></p>`;
}

function facts(items: { label: string; value: string }[]): string {
  const cells = items.filter((f) => f.value).map((f) => `
    <td style="padding:4px;" valign="top"><div style="background:#F7F5FF;border:1px solid #EDE9FE;border-radius:14px;padding:12px 14px;">
      <div style="font:600 10px ${FONT};letter-spacing:0.8px;text-transform:uppercase;color:#7C3AED;">${escapeHtml(f.label)}</div>
      <div style="margin-top:4px;font:600 14px ${FONT};color:${INK};word-break:break-word;">${escapeHtml(f.value)}</div>
    </div></td>`).join('');
  return cells ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px -4px 0;"><tr>${cells}</tr></table>` : '';
}

function steps(items: string[]): string {
  const rows = items.map((step, i) => `<tr>
    <td valign="top" style="padding:6px 12px 6px 0;width:28px;"><div style="width:26px;height:26px;border-radius:999px;background:#EDE9FE;color:#6D28D9;font:700 12px/26px ${FONT};text-align:center;">${i + 1}</div></td>
    <td style="padding:8px 0;font:14px/1.5 ${FONT};color:${MUTED};">${escapeHtml(step)}</td></tr>`).join('');
  return `<div style="margin-top:28px;padding-top:22px;border-top:1px dashed #E4E4E7;">
    <div style="font:700 13px ${FONT};color:${INK};margin-bottom:6px;">What’s next ✨</div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">${rows}</table></div>`;
}

/**
 * A user-facing email in the platform's design, framed by the template's theme.
 *
 * @param key Template key, which picks the theme.
 * @param bodyHtml The template's rendered (already escaped) text.
 */
export function renderUserEmail(opts: {
  key: string; appName: string; recipientName: string; variables: Record<string, string>; bodyHtml: string;
  cta?: { link: string; text: string };
}): string {
  const theme = EMAIL_THEMES[opts.key] ?? DEFAULT_THEME;
  const firstName = (opts.recipientName || 'there').trim().split(/\s+/)[0];
  const headline = theme.headline(opts.variables);
  const [from, to] = theme.gradient;
  const inner = `
  <tr><td style="border-radius:24px;overflow:hidden;background:#ffffff;box-shadow:0 12px 40px rgba(76,29,149,0.10);">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td bgcolor="${from}" style="background:${from};background-image:linear-gradient(135deg,${from},${to});padding:36px 36px 32px;border-radius:24px 24px 0 0;">
        <div style="font-size:44px;line-height:1;">${theme.emoji}</div>
        <div style="display:inline-block;margin-top:18px;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,0.18);font:600 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:#ffffff;">${escapeHtml(theme.eyebrow)}</div>
        <h1 style="margin:12px 0 0;font:800 28px/1.2 ${FONT};letter-spacing:-0.6px;color:#ffffff;">${escapeHtml(headline)}</h1>
      </td></tr>
      <tr><td style="padding:32px 36px 36px;">
        <p style="margin:0 0 14px;font:700 18px ${FONT};color:${INK};">Hey ${escapeHtml(firstName)} 👋</p>
        <div style="font:15px/1.7 ${FONT};color:${MUTED};">${opts.bodyHtml}</div>
        ${theme.facts ? facts(theme.facts(opts.variables)) : ''}
        ${opts.cta ? button(opts.cta.link, opts.cta.text, theme.gradient) : ''}
        ${theme.steps ? steps(theme.steps) : ''}
        <p style="margin:30px 0 0;font:14px/1.6 ${FONT};color:${MUTED};">Cheers,<br><strong style="color:${INK};">The ${escapeHtml(opts.appName)} team</strong></p>
      </td></tr>
      <tr><td style="padding:16px 36px;background:#FAFAFA;border-top:1px solid #F4F4F5;border-radius:0 0 24px 24px;font:12px/1.6 ${FONT};color:${SOFT};">${escapeHtml(theme.reason(opts.variables))}</td></tr>
    </table>
  </td></tr>`;
  return shell(opts.appName, headline, inner);
}

/** An internal notification to the platform team, in the same design. */
export function renderAdminNotification(opts: { appName: string; title: string; fields: { label: string; value: string }[] }): string {
  const rows = opts.fields.map((f) => `<tr>
    <td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font:600 12px ${FONT};color:${SOFT};text-transform:uppercase;letter-spacing:0.6px;width:34%;" valign="top">${escapeHtml(f.label)}</td>
    <td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font:14px/1.5 ${FONT};color:${INK};word-break:break-word;">${escapeHtml(f.value)}</td></tr>`).join('');
  const inner = `
  <tr><td style="border-radius:24px;background:#ffffff;box-shadow:0 12px 40px rgba(76,29,149,0.10);padding:30px 32px;">
    <div style="display:inline-block;padding:5px 12px;border-radius:999px;background:#EDE9FE;font:600 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:#6D28D9;">🔔 New activity</div>
    <h1 style="margin:12px 0 20px;font:800 22px/1.3 ${FONT};color:${INK};letter-spacing:-0.4px;">${escapeHtml(opts.title)}</h1>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #F4F4F5;border-radius:14px;">${rows}</table>
    <p style="margin:18px 0 0;font:12px ${FONT};color:${SOFT};">Automated notification. Turn these off in Admin → System Settings.</p>
  </td></tr>`;
  return shell(opts.appName, opts.title, inner);
}
