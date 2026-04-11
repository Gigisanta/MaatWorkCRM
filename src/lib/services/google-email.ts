import { google } from 'googleapis';
import { db } from '@/lib/db/db';
import { OAuth2Client } from 'google-auth-library';
import { decryptTokenIfSet } from '@/lib/utils/crypto';
import { getWelcomeEmailHtml } from '../email-templates/welcome';
import { getMeetingInvitationHtml } from '../email-templates/meeting-invitation';

const debug = process.env.NODE_ENV === 'development'
  ? (msg: string, ...args: unknown[]) => console.log(`[GoogleEmail] ${msg}`, ...args)
  : (..._: unknown[]) => {};

// ─── OAuth Client ────────────────────────────────────────────────

function createGmailClient(accessToken: string, refreshToken?: string | null): OAuth2Client {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/auth/callback/google'
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
      ? (decryptTokenIfSet(refreshToken) ?? refreshToken)
      : undefined,
  });
  return client;
}

async function getUserTokens(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: 'google' },
    select: { access_token: true, refresh_token: true },
  });
  if (!account) {
    debug('No Google account found for user:', userId);
    return null;
  }
  if (!account.access_token) {
    debug('No access_token in Google account for user:', userId);
    return null;
  }
  return {
    accessToken: (() => {
      const decrypted = decryptTokenIfSet(account.access_token!);
      return decrypted ?? account.access_token!;
    })(),
    refreshToken: account.refresh_token ?? undefined,
  };
}

// ─── Base Email Sender ──────────────────────────────────────────

async function gmailSend(
  userId: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const tokens = await getUserTokens(userId);
  if (!tokens) {
    return { success: false, error: 'Google account not connected' };
  }

  const auth = createGmailClient(tokens.accessToken, tokens.refreshToken);
  const gmail = google.gmail({ version: 'v1', auth });

  // Encode the email in base64url format for the Gmail API
  const rawMessage = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ].join('\n');

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    debug('Email sent successfully, messageId:', res.data.id);
    return { success: true, messageId: res.data.id ?? undefined };
  } catch (error: any) {
    console.error('[GoogleEmail] gmailSend error:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
    });

    if (error?.status === 401 || error?.code === 401) {
      return { success: false, error: 'GOOGLE_AUTH_EXPIRED' };
    }

    return { success: false, error: error?.message ?? 'Failed to send email' };
  }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Send a plain HTML email to a single recipient.
 */
export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return gmailSend(userId, to, subject, htmlBody);
}

/**
 * Send a meeting invitation email to a client.
 */
export async function sendMeetingInvitation(
  userId: string,
  meeting: {
    title: string;
    startAt: Date;
    endAt: Date;
    location?: string;
    description?: string;
  },
  clientEmail: string,
  clientName: string
): Promise<{ success: boolean; error?: string }> {
  const dateObj = meeting.startAt;
  const dateStr = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlBody = getMeetingInvitationHtml(
    meeting.title,
    dateStr,
    timeStr,
    meeting.location ?? '',
    clientName,
    meeting.description ?? ''
  );

  const result = await gmailSend(
    userId,
    clientEmail,
    `📅 Invitación: ${meeting.title}`,
    htmlBody
  );

  return { success: result.success, error: result.error };
}

/**
 * Send a welcome email to a newly added contact.
 */
export async function sendWelcomeEmail(
  userId: string,
  contactName: string,
  contactEmail: string
): Promise<{ success: boolean; error?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const asesorName = user?.name ?? 'Tu asesor';

  const htmlBody = getWelcomeEmailHtml(contactName, asesorName);
  const result = await gmailSend(
    userId,
    contactEmail,
    '¡Bienvenido a MaatWork!',
    htmlBody
  );

  return { success: result.success, error: result.error };
}