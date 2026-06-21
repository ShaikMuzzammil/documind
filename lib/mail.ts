import { User } from './types';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

export function emailConfigured(): boolean {
  return Boolean(RESEND_API_KEY && EMAIL_FROM);
}

export async function sendWelcomeEmail(user: User): Promise<void> {
  if (!emailConfigured()) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: user.email,
      subject: 'Welcome to DocuMind',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#111827">
          <h1 style="font-size:22px">Welcome to DocuMind, ${user.name}</h1>
          <p>Your workspace is ready. Upload documents, organize them into collections, and ask cited questions.</p>
          <p><a href="${appUrl}/documents" style="color:#4f46e5">Open your document vault</a></p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    throw new Error(`Email request failed: ${res.status}`);
  }
}
