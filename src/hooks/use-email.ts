import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSendEmail() {
  const sendMeetingInvitation = useMutation({
    mutationFn: async ({
      userId,
      meetingId,
      clientEmail,
      clientName,
      meeting,
    }: {
      userId: string;
      meetingId: string;
      clientEmail: string;
      clientName: string;
      meeting: {
        title: string;
        startAt: Date;
        endAt: Date;
        location?: string;
        description?: string;
      };
    }) => {
      const res = await fetch(`/api/meetings/${meetingId}/send-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, clientEmail, clientName, meeting }),
      });
      if (!res.ok) throw new Error('Failed to send invitation');
      return res.json();
    },
    onSuccess: () => toast.success('Invitacion enviada correctamente'),
    onError: () => toast.error('Error al enviar la invitacion'),
  });

  const sendWelcomeEmail = useMutation({
    mutationFn: async ({
      userId,
      contactId,
      contactName,
      contactEmail,
    }: {
      userId: string;
      contactId: string;
      contactName: string;
      contactEmail: string;
    }) => {
      const res = await fetch(`/api/contacts/${contactId}/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, contactName, contactEmail }),
      });
      if (!res.ok) throw new Error('Failed to send welcome email');
      return res.json();
    },
    onSuccess: () => toast.success('Mail de bienvenida enviado'),
    onError: () => toast.error('Error al enviar el mail de bienvenida'),
  });

  return { sendMeetingInvitation, sendWelcomeEmail };
}
