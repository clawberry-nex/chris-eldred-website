import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const MAX_FIELD = 4000;

function clean(v: unknown, max = MAX_FIELD): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? 'Chris Eldred Site <onboarding@resend.dev>';

  if (!apiKey || !to) {
    console.error('Missing RESEND_API_KEY or CONTACT_TO_EMAIL env var');
    return res.status(500).json({ error: 'Server is not configured to send mail yet.' });
  }

  const body = req.body ?? {};
  const name = clean(body.name, 200);
  const email = clean(body.email, 200);
  const date = clean(body.date, 40);
  const message = clean(body.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Email address looks invalid.' });
  }

  const subject = `Booking enquiry from ${name}`;
  const text =
    `New booking enquiry via chriseldred.co.uk\n\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    (date ? `Date: ${date}\n` : '') +
    `\n${message}\n`;

  const html = `
    <h2 style="font-family: Georgia, serif; margin: 0 0 16px;">Booking enquiry</h2>
    <p style="font-family: sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
      <strong>Name:</strong> ${escapeHtml(name)}<br />
      <strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
      ${date ? `<br /><strong>Date:</strong> ${escapeHtml(date)}` : ''}
    </p>
    <pre style="font-family: sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</pre>
  `;

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject,
      text,
      html,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return res.status(502).json({ error: 'Mail provider rejected the request.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact send failed:', err);
    return res.status(500).json({ error: 'Could not send the enquiry. Please email directly.' });
  }
}
