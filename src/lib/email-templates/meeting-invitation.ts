export function getMeetingInvitationHtml(
  meetingTitle: string,
  date: string,
  time: string,
  location: string,
  clientName: string,
  notes: string
): string {
  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📅 Invitación a Reunión</h1>
      </div>
      <div style="padding: 32px; background: #0E0F12; color: #F0EFE9;">
        <h2 style="color: #A78BFA;">${meetingTitle}</h2>
        <p><strong>📆 Fecha:</strong> ${date}</p>
        <p><strong>⏰ Hora:</strong> ${time}</p>
        ${location ? `<p><strong>📍 Ubicación:</strong> ${location}</p>` : ''}
        ${notes ? `<p><strong>📝 Notas:</strong> ${notes}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #1C1D21; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">Este email fue enviado por ${clientName} a través de MaatWork CRM.</p>
      </div>
    </div>
  `;
}