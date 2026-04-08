export function getWelcomeEmailHtml(contactName: string, asesorName: string): string {
  return `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">¡Bienvenido a MaatWork!</h1>
      </div>
      <div style="padding: 32px; background: #0E0F12; color: #F0EFE9;">
        <p style="font-size: 16px;">Hola <strong>${contactName}</strong>,</p>
        <p style="font-size: 14px; color: #A78BFA;">Tu asesor <strong>${asesorName}</strong> te ha registrado en MaatWork CRM.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/login" style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Acceder al CRM
          </a>
        </div>
      </div>
    </div>
  `;
}