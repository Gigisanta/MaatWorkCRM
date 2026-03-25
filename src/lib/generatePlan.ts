// Sanitization helpers
const SAFE_PHONE_REGEX = /^[+\d\s\-().]+$/;
const SAFE_URL_REGEX = /^https?:\/\//;

function sanitizePhone(phone: string | undefined): string {
  if (!phone) return '';
  // Remove any javascript: or other dangerous protocols
  if (!SAFE_PHONE_REGEX.test(phone)) return '';
  return phone;
}

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '#';
  if (!SAFE_URL_REGEX.test(url)) return '#';
  // Block javascript: and other dangerous schemes
  if (url.trim().toLowerCase().startsWith('javascript:')) return '#';
  return url;
}

// Paleta de colores CACTUS
// Local type definitions (replacing non-existent Prisma models)
interface AsignacionEstrategica {
  claseActivo: string;
  porcentaje: number;
  descripcion?: string;
}

interface PlanInstrument {
  nombre: string;
  moneda?: string;
  tipo?: string;
  claseActivo?: string;
  participacion?: number;
  notas?: string;
  emisor?: string;
}

interface ObligacionNegociable {
  acreedor: string;
  tipo?: string;
  saldoPendiente?: number;
  tasaInteres?: number;
  cuotaMensual?: number;
  fechaVencimiento?: string;
}

interface Riesgo {
  nombre: string;
  tipo?: string;
  probabilidad?: 'alta' | 'media' | 'baja';
  impacto?: 'alto' | 'medio' | 'bajo';
  mitigacion?: string;
}

interface MetaVida {
  nombre: string;
  prioridad?: 'alta' | 'media' | 'baja';
  montoObjetivo?: number;
  fechaEstimada?: string;
  notes?: string;
}

const COLORS = {
  cactusDark: '#2D5A4A',
  cactusMedium: '#3D7A5F',
  cactusLight: '#5A9E7F',
  sandLight: '#F5F0E8',
  sandMedium: '#E8DFD0',
  sandDark: '#D4C5A9',
  terracotta: '#C4846C',
  white: '#FFFFFF',
  text: '#333333',
};

export interface PlanData {
  edad: number;
  profesion: string;
  objetivo: string;
  aporteMensual: number;
  aporteInicial?: number;
  perfilRiesgo: string;
  horizonteMeses: number;
  gastosPrincipales: string;
  observaciones?: string;
  // New configuration fields
  webUrl?: string;
  asesorTelefono?: string;
  asesorMensajePredefinido?: string;
  tipoAporte?: 'mensual' | 'unico' | 'semanal' | 'quincenal' | 'trimestral' | 'anual';
  asesorNombre?: string;
  asesorRecomendacion?: boolean;
  platformLinks?: { name: string; url: string }[];
  socialLinks?: { name: string; url: string; icon?: string }[];
  // Portfolio data
  asignacionEstrategica?: AsignacionEstrategica[];
  instruments?: PlanInstrument[];
  obligacionesNegociables?: ObligacionNegociable[];
  riesgos?: Riesgo[];
  beneficiosFiscales?: string[];
  terminoFinanciero?: string;
  usarTerminoIA?: boolean;
  consejoFinal?: string;
  usarConsejoIA?: boolean;
  // Financial health data
  ingresosMensuales?: number;
  gastosMensuales?: number;
  fondoEmergenciaMeses?: number;
  fondoEmergenciaActual?: number;
  metasVida?: MetaVida[];
  proyeccionRetiro?: string;
  patrimonioActivos?: number;
  patrimonioDeudas?: number;
  attachedFiles?: { name: string; type: string; data: string; size: number }[];
  // Branding
  colorPrincipal?: string;
  colorAcento?: string;
  logoUrl?: string;
}

export function generatePlanHTML(data: PlanData): string {
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate contribution based on type
  let contributionText = '';
  let montoObjetivo = (data.aporteInicial || 0) + (data.aporteMensual * data.horizonteMeses);

  switch (data.tipoAporte) {
    case 'unico':
      contributionText = `Aporte único de USD ${data.aporteMensual.toLocaleString()}`;
      montoObjetivo = data.aporteMensual;
      break;
    case 'semanal':
      contributionText = `Aporte semanal de USD ${data.aporteMensual.toLocaleString()}`;
      montoObjetivo = (data.aporteInicial || 0) + data.aporteMensual * 4 * (data.horizonteMeses / 4);
      break;
    case 'quincenal':
      contributionText = `Aporte quincenal de USD ${data.aporteMensual.toLocaleString()}`;
      montoObjetivo = (data.aporteInicial || 0) + data.aporteMensual * 2 * (data.horizonteMeses / 2);
      break;
    default: // mensual
      contributionText = `Aporte mensual de USD ${data.aporteMensual.toLocaleString()}`;
      montoObjetivo = (data.aporteInicial || 0) + data.aporteMensual * data.horizonteMeses;
  }

  const webUrl = data.webUrl || 'cactuswealth.com.ar';
  const asesorNombre = data.asesorNombre || 'Giolivo Santarelli';
  const showRecomendaciones = data.asesorRecomendacion !== false;

  // Platform links
  const platformLinksHTML = (data.platformLinks || []).map(link =>
    `<a href="${sanitizeUrl(link.url)}" target="_blank" class="account-link">
      <span class="link-icon">🔗</span>
      ${link.name}
    </a>`
  ).join('\n    ');

  // Social links
  const socialLinksHTML = (data.socialLinks || []).map(link => {
    const isInstagram = link.icon === 'instagram' || link.name.toLowerCase().includes('instagram');
    const isWhatsapp = link.icon === 'whatsapp' || link.name.toLowerCase().includes('whatsapp');
    const className = isInstagram ? 'footer-link instagram' : (isWhatsapp ? 'footer-link whatsapp' : 'footer-link');
    const icon = isInstagram ? '📸' : (isWhatsapp ? '💬' : '🔗');
    return `<a href="${sanitizeUrl(link.url)}" target="_blank" class="${className}">
      <span class="icon">${icon}</span>
      ${link.name}
    </a>`;
  }).join('\n    ');


  // WhatsApp Share URL
  const whatsappMsg = data.asesorMensajePredefinido || `Hola, te comparto el contacto de mi asesor financiero ${asesorNombre} (Tel: ${sanitizePhone(data.asesorTelefono)}).`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

  // Floating button HTML
  const floatingWhatsappHTML = `
    <a href="${whatsappUrl}" target="_blank" class="floating-whatsapp">
      <span>Recomendar asesor</span>
      <span class="wapp-icon">🔗</span>
    </a>
  `;

  // Recommendation box HTML
  const recommendBoxHTML = showRecomendaciones ? `
    <div class="recommend-box">
      <span class="icon">💬</span>
      <p>
        <strong>Te gustó este plan?</strong> Si tenés amigos o familiares que podrían beneficiarse de una planificación financiera,
        no dudes en recomendar a <strong>${asesorNombre}</strong>. Las referencias son la mejor forma de agradecer!
      </p>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan Financiero - ${data.profesion}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-dark: ${data.colorPrincipal ? `color-mix(in srgb, ${data.colorPrincipal} 80%, black)` : "#2D5A4A"};
      --primary: ${data.colorPrincipal || "#3D7A5F"};
      --primary-light: ${data.colorPrincipal ? `color-mix(in srgb, ${data.colorPrincipal} 80%, white)` : "#5A9E7F"};
      --primary-pale: ${data.colorPrincipal ? `color-mix(in srgb, ${data.colorPrincipal} 40%, white)` : "#8BC4A8"};
      --primary-muted: ${data.colorPrincipal ? `color-mix(in srgb, ${data.colorPrincipal} 20%, white)` : "#B8DBC8"};
      --accent: ${data.colorAcento || "#C4846C"};
      --accent-light: ${data.colorAcento ? `color-mix(in srgb, ${data.colorAcento} 80%, white)` : "#D9A58B"};
      --accent-pale: ${data.colorAcento ? `color-mix(in srgb, ${data.colorAcento} 30%, white)` : "#F0DFD5"};
      --background: #FAFAF8;
      --surface: #FFFFFF;
      --surface-alt: #F5F4F0;
      --border: #E8E6E0;
      --border-light: #F0EEE8;
      --text-dark: #1F2D26;
      --text-medium: #4A5B50;
      --text-light: #7A8B80;
      --text-muted: #A0ACA5;
      --success: #5A9E7F;
      --warning: #D4A574;
      --danger: #C4746C;
      --instagram: #E1306C;
      --whatsapp: #25D366;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
      color: var(--text-dark);
      background-color: var(--background);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      max-width: 880px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* ===== HEADER ===== */
    .header {
      background: linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: #FFFFFF;
      padding: 52px 44px;
      border-radius: 28px;
      margin-bottom: 32px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(45, 90, 74, 0.25);
    }

    .header::before {
      content: '';
      position: absolute;
      top: -60%;
      right: -25%;
      width: 70%;
      height: 220%;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
      border-radius: 50%;
    }

    .header::after {

      position: absolute;
      bottom: 16px;
      right: 28px;
      font-size: 90px;
      opacity: 0.12;
    }

    .header-content {
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .header h1 {
      font-family: 'Playfair Display', serif;
      font-size: 38px;
      font-weight: 600;
      margin-bottom: 14px;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }

    .header .subtitle {
      font-size: 18px;
      opacity: 0.92;
      font-weight: 400;
      color: #FFFFFF;
    }

    .header .meta {
      margin-top: 22px;
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      padding: 12px 24px;
      background: rgba(255,255,255,0.12);
      border-radius: 30px;
      display: inline-block;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.08);
    }

    /* ===== ACCOUNT SECTION ===== */
    .account-section {
      background: #FFFFFF;
      padding: 34px;
      border-radius: 22px;
      margin-bottom: 28px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.04);
      border: 1px solid #E8E6E0;
    }

    .account-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
    }

    .account-header .icon {
      font-size: 30px;
    }

    .account-header h2 {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 600;
      color: #1F2D26;
    }

    .account-intro {
      font-size: 15px;
      color: #4A5B50;
      margin-bottom: 26px;
      line-height: 1.75;
    }

    .account-links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .account-link {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 16px 30px;
      background: linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: #FFFFFF;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 15px;
      transition: all 0.2s ease;
      box-shadow: 0 6px 16px rgba(61, 122, 95, 0.3);
    }

    .account-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(61, 122, 95, 0.4);
      background: var(--primary-dark);
    }

    .account-link .link-icon {
      font-size: 18px;
    }

    /* ===== WELCOME SECTION ===== */
    .welcome-section {
      background: #F5F4F0;
      padding: 34px;
      border-radius: 22px;
      margin-bottom: 28px;
      border: 1px solid #E8E6E0;
      position: relative;
    }

    .welcome-section::before {
      content: '';
      position: absolute;
      left: 0;
      top: 24px;
      bottom: 24px;
      width: 4px;
      background: linear-gradient(180deg, var(--primary) 0%, var(--primary-light) 100%);
      border-radius: 4px;
    }

    .welcome-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
    }

    .welcome-emoji {
      font-size: 40px;
    }

    .welcome-title {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 600;
      color: #1F2D26;
    }

    .welcome-text {
      color: #4A5B50;
      font-size: 15px;
      line-height: 1.8;
    }

    .welcome-list {
      margin-top: 22px;
      padding-left: 0;
      list-style: none;
    }

    .welcome-list li {
      margin-bottom: 14px;
      color: #4A5B50;
      font-size: 14px;
      padding-left: 26px;
      position: relative;
    }

    .welcome-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--primary);
      font-weight: 600;
    }

    .welcome-list li strong {
      color: var(--primary-dark);
    }

    /* ===== RECOMMEND BOX ===== */
    .recommend-box {
      background: linear-gradient(135deg, #F0DFD5 0%, #FDF8F5 100%);
      padding: 26px;
      border-radius: 16px;
      margin: 24px 0;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #D9A58B;
    }

    .recommend-box .icon {
      font-size: 28px;
      flex-shrink: 0;
    }

    .recommend-box p {
      font-size: 14px;
      line-height: 1.65;
      color: #4A5B50;
    }

    .recommend-box strong {
      color: var(--accent);
    }

    /* ===== CLIENT CARDS ===== */
    .client-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 18px;
      margin-bottom: 32px;
    }

    .client-card {
      background: #FFFFFF;
      border-radius: 18px;
      padding: 26px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.04);
      border: 1px solid #F0EEE8;
      transition: all 0.2s ease;
    }

    .client-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.06);
    }

    .client-card .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
      font-weight: 600;
      margin-bottom: 10px;
    }

    .client-card .value {
      font-size: 24px;
      font-weight: 700;
      color: #1F2D26;
      font-family: 'DM Sans', sans-serif;
    }

    .client-card .value.accent {
      color: var(--accent);
    }

    /* ===== SECTION ===== */
    .section {
      background: #FFFFFF;
      border-radius: 22px;
      padding: 40px;
      margin-bottom: 28px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.04);
      border: 1px solid #F0EEE8;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 30px;
      padding-bottom: 22px;
      border-bottom: 1px solid #F0EEE8;
    }

    .section-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 6px 16px rgba(61, 122, 95, 0.25);
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 600;
      color: #1F2D26;
      letter-spacing: -0.3px;
    }

    .section-subtitle {
      font-size: 14px;
      color: #7A8B80;
      margin-top: 5px;
    }

    /* ===== OBJETIVO BOX ===== */
    .objetivo-box {
      background: linear-gradient(135deg, #F5F4F0 0%, #FFFFFF 100%);
      padding: 30px;
      border-radius: 18px;
      margin-bottom: 26px;
      border-left: 4px solid var(--accent);
      box-shadow: 0 2px 12px rgba(0,0,0,0.02);
    }

    .objetivo-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #7A8B80;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .objetivo-box .objetivo-text {
      font-size: 19px;
      font-weight: 500;
      color: #1F2D26;
      margin-bottom: 22px;
      line-height: 1.55;
    }

    .objetivo-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin-top: 22px;
    }

    .objetivo-meta-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .objetivo-meta-item .label {
      font-size: 13px;
      color: #7A8B80;
    }

    .objetivo-meta-item .value {
      font-size: 15px;
      font-weight: 600;
      color: var(--accent);
    }

    /* ===== INFO BOX ===== */
    .info-box {
      background: #F5F4F0;
      padding: 20px 24px;
      border-radius: 14px;
      margin: 22px 0;
      color: #4A5B50;
      font-size: 14px;
      line-height: 1.75;
      border: 1px solid #E8E6E0;
    }

    .info-box strong {
      color: var(--primary-dark);
    }

    /* ===== TABLES ===== */
    .table-container {
      overflow-x: auto;
      margin: 20px 0;
      border-radius: 16px;
      border: 1px solid #E8E6E0;
      box-shadow: 0 2px 12px rgba(0,0,0,0.03);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: #FFFFFF;
      font-weight: 600;
      padding: 16px 20px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    th:first-child {
      border-radius: 15px 0 0 0;
    }

    th:last-child {
      border-radius: 0 15px 0 0;
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid #F0EEE8;
      vertical-align: middle;
      color: #4A5B50;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:nth-child(even) {
      background: #FAFAF8;
    }

    tr:hover {
      background: rgba(61, 122, 95, 0.04);
    }

    /* ===== BADGES ===== */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-bajo {
      background: rgba(90, 158, 127, 0.12);
      color: var(--primary-dark);
    }

    .badge-medio {
      background: rgba(212, 165, 116, 0.15);
      color: #A67C4A;
    }

    .badge-alto {
      background: rgba(196, 116, 108, 0.12);
      color: #A65D55;
    }

    .badge-moneda {
      background: var(--surface-alt);
      color: var(--text-dark);
      border: 1px solid var(--border);
    }

    /* ===== PROGRESS BARS ===== */
    .progress-container {
      margin: 20px 0;
    }

    .progress-item {
      margin-bottom: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--text-medium);
    }

    .progress-header strong {
      color: var(--text-dark);
    }

    .progress-bar {
      height: 10px;
      background: var(--surface-alt);
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.3s ease;
      background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
    }

    /* ===== CARDS GRID ===== */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }

    .instrument-card {
      background: var(--surface-alt);
      border-radius: 14px;
      padding: 20px;
      border: 1px solid var(--border-light);
      transition: all 0.2s ease;
    }

    .instrument-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }

    .instrument-card .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      background: none;
      padding: 0;
      box-shadow: none;
      border-radius: 0;
    }

    .instrument-card .name {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 15px;
    }

    .instrument-card .type {
      font-size: 13px;
      color: var(--text-light);
      margin-bottom: 12px;
    }

    .instrument-card .allocation {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .instrument-card .allocation-bar {
      flex: 1;
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }

    .instrument-card .allocation-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 4px;
    }

    .instrument-card .allocation-value {
      font-weight: 600;
      color: var(--primary-dark);
      min-width: 40px;
      text-align: right;
      font-size: 14px;
    }

    .instrument-card .objetivo {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 10px;
    }

    /* ===== RESUMEN CARTERA ===== */
    .resumen-cartera {
      background: linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: #FFFFFF;
      padding: 32px;
      border-radius: 20px;
      margin-top: 32px;
      box-shadow: 0 8px 32px rgba(45, 90, 74, 0.2);
    }

    .resumen-cartera h4 {
      font-size: 16px;
      margin-bottom: 24px;
      font-weight: 600;
      letter-spacing: 0.3px;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .resumen-item {
      text-align: center;
      padding: 16px;
      background: rgba(255,255,255,0.08);
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.06);
    }

    .resumen-item .label {
      font-size: 11px;
      opacity: 0.85;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .resumen-item .value {
      font-size: 26px;
      font-weight: 700;
      color: #FFFFFF;
    }

    /* ===== DEFINITION BOX ===== */
    .definition-box {
      background: #F5F4F0;
      padding: 26px;
      border-radius: 16px;
      margin: 26px 0;
      border-left: 4px solid var(--primary);
    }

    .definition-box .term {
      font-weight: 600;
      color: var(--primary-dark);
      margin-bottom: 12px;
      display: block;
      font-size: 14px;
    }

    .definition-box .definition {
      color: #4A5B50;
      font-size: 14px;
      line-height: 1.75;
    }

    /* ===== BENEFICIOS LIST ===== */
    .beneficios-list {
      list-style: none;
      padding: 0;
    }

    .beneficios-list li {
      padding: 20px 24px;
      margin-bottom: 14px;
      background: #F5F4F0;
      border-radius: 14px;
      border-left: 3px solid var(--primary-light);
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .beneficios-list li .icon {
      font-size: 18px;
      flex-shrink: 0;
      color: var(--primary);
    }

    .beneficios-list li .content {
      flex: 1;
      font-size: 14px;
      color: var(--text-medium);
      line-height: 1.6;
    }

    .beneficios-list li strong {
      color: var(--text-dark);
    }

    /* ===== CONSEJO BOX ===== */
    .consejo-box {
      background: linear-gradient(145deg, var(--accent) 0%, var(--accent-light) 100%);
      color: #FFFFFF;
      padding: 44px 48px;
      border-radius: 24px;
      text-align: center;
      margin-top: 32px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(196, 132, 108, 0.35);
    }

    .consejo-box::before {
      content: '"';
      position: absolute;
      top: -15px;
      left: 18px;
      font-size: 130px;
      opacity: 0.06;
      font-family: 'Playfair Display', serif;
      line-height: 1;
      color: #FFFFFF;
    }

    .consejo-box::after {
      content: '"';
      position: absolute;
      bottom: -50px;
      right: 18px;
      font-size: 130px;
      opacity: 0.06;
      font-family: 'Playfair Display', serif;
      line-height: 1;
      color: #FFFFFF;
    }

    .consejo-box h4 {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #FFFFFF;
      letter-spacing: -0.3px;
      position: relative;
      z-index: 2;
    }

    .consejo-box p {
      font-size: 17px;
      line-height: 1.8;
      color: #FFFFFF;
      opacity: 0.98;
      position: relative;
      z-index: 2;
      max-width: 92%;
      margin: 0 auto;
    }

    .consejo-box .consejo-footer {
      margin-top: 24px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.92);
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.28);
      font-style: italic;
      position: relative;
      z-index: 2;
    }

    .consejo-box .consejo-footer::before {
      content: '📌 ';
      font-style: normal;
    }

    /* ===== FOOTER WITH LINKS ===== */
    .footer {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 40px;
      margin-top: 40px;
      border: 1px solid #E8E6E0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }

    .footer-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .footer-header h4 {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      color: #1F2D26;
      margin-bottom: 10px;
    }

    .footer-header p {
      font-size: 14px;
      color: #7A8B80;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 28px;
    }

    .footer-link {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 16px 32px;
      background: linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: #FFFFFF;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s ease;
      box-shadow: 0 6px 16px rgba(45, 90, 74, 0.3);
    }

    .footer-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(45, 90, 74, 0.4);
    }

    .footer-link .icon {
      font-size: 18px;
    }

    .footer-link.instagram {
      background: linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%);
      box-shadow: 0 6px 16px rgba(225, 48, 108, 0.35);
    }

    .footer-link.instagram:hover {
      box-shadow: 0 8px 24px rgba(225, 48, 108, 0.45);
    }

    .footer-link.whatsapp {
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      box-shadow: 0 6px 16px rgba(37, 211, 102, 0.35);
    }

    .footer-link.whatsapp:hover {
      box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
    }

    .footer-disclaimer {
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      padding-top: 20px;
      border-top: 1px solid var(--border-light);
      line-height: 1.6;
    }

    /* ===== ATTACHMENTS SECTION ===== */
    .attachments-section {
      background: var(--surface);
      border-radius: 20px;
      padding: 36px;
      margin-bottom: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.04);
      border: 1px solid var(--border-light);
    }

    .attachments-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-light);
    }

    .attachments-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }

    .attachments-title {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 600;
      color: var(--text-dark);
    }

    .attachments-subtitle {
      font-size: 14px;
      color: var(--text-light);
      margin-top: 4px;
    }

    .attachment-card {
      background: var(--surface-alt);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 16px;
      border: 1px solid var(--border-light);
    }

    .attachment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .attachment-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .attachment-icon {
      width: 40px;
      height: 40px;
      background: var(--accent);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .attachment-name {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 15px;
    }

    .attachment-size {
      font-size: 12px;
      color: var(--text-light);
      margin-top: 2px;
    }

    .attachment-download {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 500;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .attachment-download:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(45, 90, 74, 0.3);
    }

    .attachment-preview {
      margin-top: 16px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .attachment-preview iframe {
      width: 100%;
      height: 300px;
      border: none;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .container {
        padding: 20px 16px;
      }
      .header {
        padding: 32px 24px;
      }
      .header h1 {
        font-size: 28px;
      }
      .section {
        padding: 24px;
      }
      .client-cards {
        grid-template-columns: 1fr 1fr;
      }
      .resumen-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .objetivo-meta {
        flex-direction: column;
        gap: 12px;
      }
      .footer-links {
        flex-direction: column;
        align-items: stretch;
      }
      .account-links {
        flex-direction: column;
      }
      .recommend-box {
        flex-direction: column;
        text-align: center;
      }
    }


    /* ===== FLOATING WHATSAPP BUTTON ===== */
    .floating-whatsapp {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #FFFFFF;
      padding: 10px 16px;
      border-radius: 30px;
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border: 1px solid #E8E6E0;
      z-index: 1000;
      transition: all 0.3s ease;
    }
    .floating-whatsapp:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      border-color: #25D366;
    }
    .floating-whatsapp span {
      font-size: 13px;
      font-weight: 600;
      color: #1F2D26;
    }
    .floating-whatsapp .wapp-icon {
      font-size: 18px;
    }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .section {
      animation: fadeIn 0.4s ease-out;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>Tu Plan Financiero</h1>
        <div class="subtitle">${data.profesion} | ${data.edad} años | Perfil ${data.perfilRiesgo}</div>
        <div class="meta">Generado el ${fecha}</div>
      </div>
    </div>

    <!-- Account Section -->
    <div class="account-section">
      <div class="account-header">
        <span class="icon">🔐</span>
        <h2>Asegurate de tener tu cuenta</h2>
      </div>
      <p class="account-intro">
        Antes de empezar a invertir, necesitas tener una cuenta en una plataforma habilitada.
        Estas son las plataformas recomendadas para ejecutar tu plan:
      </p>
      <div class="account-links">
        ${platformLinksHTML}
      </div>
    </div>

    <!-- Sección de Bienvenida -->
    <div class="welcome-section">
      <div class="welcome-header">
        <span class="welcome-emoji">👋</span>
        <h2 class="welcome-title">Bienvenido a tu Hoja de Ruta</h2>
      </div>
      <p class="welcome-text">
        Este documento es tu <strong>guía personalizada</strong> para alcanzar tus objetivos financieros.
        Aquí encontrarás una estrategia diseñada específicamente para vos, considerando tu edad,
        perfil de riesgo y metas a ${data.horizonteMeses} meses.
      </p>
      <ul class="welcome-list">
        <li><strong>Que incluye este plan:</strong> Una cartera diversificada, beneficios fiscales y una estrategia clara.</li>
        <li><strong>Como usarlo:</strong> Revisá cada sección, anotá tus dudas y consultá con tu asesor.</li>
        <li><strong>Que esperar:</strong> Este plan está pensado para crecer con vos, ajustalo según cambien tus necesidades.</li>
      </ul>
    </div>

    <div class="client-cards">
      <div class="client-card">
        <div class="label">Edad</div>
        <div class="value">${data.edad} años</div>
      </div>
            <div class="client-card">
        <div class="label">Aporte Inicial</div>
        <div class="value">USD ${(data.aporteInicial || 0).toLocaleString()}</div>
      </div>
      <div class="client-card">
        <div class="label">${data.tipoAporte === 'unico' ? 'Aporte' : 'Aporte Mensual'}</div>
        <div class="value">USD ${data.aporteMensual.toLocaleString()}</div>
      </div>
      <div class="client-card">
        <div class="label">Horizonte</div>
        <div class="value">${data.horizonteMeses} meses</div>
      </div>
      <div class="client-card">
        <div class="label">Meta Financiera</div>
        <div class="value accent">USD ${montoObjetivo.toLocaleString()}</div>
      </div>
    </div>

    <!-- Sección 1: Estrategia Principal -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏦</div>
        <div>
          <h2 class="section-title">Tu Estrategia Principal</h2>
          <p class="section-subtitle">El punto de partida de tu camino financiero</p>
        </div>
      </div>

      <div class="objetivo-box">
        <h3>🎯 Tu Objetivo</h3>
        <p class="objetivo-text">${data.objetivo}</p>
        <div class="objetivo-meta">
          ${(data.aporteInicial && data.aporteInicial > 0) ? `
          <div class="objetivo-meta-item">
            <span class="label">Aporte inicial:</span>
            <span class="value">USD ${data.aporteInicial.toLocaleString()}</span>
          </div>` : ''}
          <div class="objetivo-meta-item">
            <span class="label">Meta financiera:</span>
            <span class="value">USD ${montoObjetivo.toLocaleString()}</span>
          </div>
          <div class="objetivo-meta-item">
            <span class="label">Horizonte:</span>
            <span class="value">${data.horizonteMeses} meses</span>
          </div>
          <div class="objetivo-meta-item">
            <span class="label">${data.tipoAporte === 'unico' ? 'Aporte:' : 'Aporte mensual:'}</span>
            <span class="value">${contributionText}</span>
          </div>
        </div>
      </div>

      <div class="info-box">
        💡 <strong>Por qué esta estrategia:</strong> Basado en tu perfil <strong>${data.perfilRiesgo}</strong>,
        diseñamos una cartera que balancea crecimiento y protección. Tu edad de ${data.edad} años
        te permite aprovechar el poder del interés compuesto a largo plazo.
      </div>

      <div class="definition-box">
        <span class="term">📚 Término Clave del Mes</span>
        <p class="definition">El interés compuesto es cuando tus ganancias generan más ganancias. Es como una bola de nieve que crece con el tiempo. En Argentina, empezarlo joven es una gran ventaja.</p>
      </div>

      ${recommendBoxHTML}
    </div>

    <!-- Sección 2: Asignación Estratégica -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📊</div>
        <div>
          <h2 class="section-title">Tu Asignación Estratégica</h2>
          <p class="section-subtitle">Cómo distribuir tus inversiones según el horizonte temporal</p>
        </div>
      </div>

      <div class="info-box">
        💡 <strong>Qué significa esto:</strong> No todo tu dinero debe estar invertido igual.
        Dividimos tu cartera en "horizontes" según cuándo podrías necesitar cada parte.
        El <strong>corto plazo</strong> es para tu fondo de emergencia, el <strong>largo plazo</strong> busca crecimiento.
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Clase Activo</th>
              <th>% Cartera</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${(data.asignacionEstrategica || []).map(asig => `
            <tr>
              <td><strong>${asig.claseActivo}</strong></td>
              <td>${asig.porcentaje}%</td>
              <td>${asig.descripcion || '-'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="progress-container">
        <h4 style="font-size: 14px; color: var(--text-dark); margin-bottom: 16px; font-weight: 600;">📈 Distribución Visual</h4>
        ${(data.asignacionEstrategica || []).map((asig, idx) => `
        <div class="progress-item">
          <div class="progress-header">
            <span>${asig.claseActivo}</span>
            <span><strong>${asig.porcentaje}%</strong></span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${asig.porcentaje}%"></div>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <!-- Sección 3: Cartera Sugerida -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🧱</div>
        <div>
          <h2 class="section-title">Tu Cartera de Inversiones</h2>
          <p class="section-subtitle">Los instrumentos específicos que recomendamos</p>
        </div>
      </div>

      <div class="info-box">
        💡 <strong>Cómo leer esto:</strong> Cada tarjeta representa un instrumento financiero.
        El porcentaje indica cuánto de tu cartera debería estar ahí.
        <strong>USD</strong> significa que está en dólares, <strong>ARS</strong> en pesos.
      </div>

      <div class="cards-grid">
        ${(data.instruments || []).map(inst => `
        <div class="instrument-card">
          <div class="header">
            <span class="name">${inst.nombre}</span>
            <span class="badge badge-moneda">${inst.moneda || 'N/A'}</span>
          </div>
          <p class="type">${inst.tipo || inst.claseActivo || 'N/A'}</p>
          <div class="allocation">
            <div class="allocation-bar">
              <div class="allocation-fill" style="width: ${inst.participacion || 0}%"></div>
            </div>
            <span class="allocation-value">${inst.participacion || 0}%</span>
          </div>
          <p class="objetivo">${inst.notas || (inst.emisor ? `Emisor: ${inst.emisor}` : '')}</p>
        </div>`).join('')}
      </div>

      <div class="resumen-cartera">
        <h4>📈 Resumen de tu Cartera</h4>
        <div class="resumen-grid">
          <div class="resumen-item">
            <div class="label">Exposición USD</div>
            <div class="value">${data.instruments?.filter(i => i.moneda === 'USD').reduce((s, i) => s + (i.participacion || 0), 0) || 0}%</div>
          </div>
          <div class="resumen-item">
            <div class="label">Exposición ARS</div>
            <div class="value">${data.instruments?.filter(i => i.moneda === 'ARS').reduce((s, i) => s + (i.participacion || 0), 0) || 0}%</div>
          </div>
          <div class="resumen-item">
            <div class="label">Mixto</div>
            <div class="value">${data.instruments?.filter(i => i.moneda === 'Mix').reduce((s, i) => s + (i.participacion || 0), 0) || 0}%</div>
          </div>
        </div>
        <div class="resumen-grid" style="margin-top: 16px;">
          <div class="resumen-item">
            <div class="label">Renta Fija</div>
            <div class="value">${data.instruments?.filter(i => i.claseActivo?.includes('Renta Fija')).reduce((s, i) => s + (i.participacion || 0), 0) || 0}%</div>
          </div>
          <div class="resumen-item">
            <div class="label">Renta Variable</div>
            <div class="value">${data.instruments?.filter(i => i.claseActivo?.includes('Renta Variable')).reduce((s, i) => s + (i.participacion || 0), 0) || 0}%</div>
          </div>
          <div class="resumen-item">
            <div class="label">Liquidez</div>
            <div class="value">24-48hs</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección 4: Obligaciones Negociables -->
    ${(data.obligacionesNegociables && data.obligacionesNegociables.length > 0) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🏷️</div>
        <div>
          <h2 class="section-title">Obligaciones Negociables</h2>
          <p class="section-subtitle">Renta fija corporativa</p>
        </div>
      </div>

      <div class="info-box">
        💡 <strong>Qué son las ONs:</strong> Son préstamos que le hacés a empresas grandes.
        Ellas te pagan intereses (cupón) y te devuelven el capital al vencimiento.
        Es una forma de <strong>ahorrar en dólares con renta</strong>.
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Acreedor</th>
              <th>Tipo</th>
              <th>Saldo Pendiente</th>
              <th>Tasa Interés</th>
              <th>Cuota Mensual</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            ${data.obligacionesNegociables.map(on => `
            <tr>
              <td><strong>${on.acreedor}</strong></td>
              <td>${on.tipo || '-'}</td>
              <td>${on.saldoPendiente ? `USD ${on.saldoPendiente.toLocaleString()}` : '-'}</td>
              <td>${on.tasaInteres ? `${on.tasaInteres}%` : '-'}</td>
              <td>${on.cuotaMensual ? `USD ${on.cuotaMensual.toLocaleString()}` : '-'}</td>
              <td>${on.fechaVencimiento ? new Date(on.fechaVencimiento).toLocaleDateString('es-AR') : '-'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- Sección 5: Riesgos y Mitigación -->
    ${(data.riesgos && data.riesgos.length > 0) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📚</div>
        <div>
          <h2 class="section-title">Riesgos y Mitigación</h2>
          <p class="section-subtitle">Conocer los riesgos es el primer paso para gestionarlos</p>
        </div>
      </div>

      <div class="info-box">
        💡 <strong>Por qué hablamos de riesgos:</strong> Toda inversión tiene riesgos, pero saber cuáles son
        nos permite <strong>mitigarlos inteligentemente</strong>. No se trata de evitar riesgos, sino de
        gestionarlos de forma consciente.
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Riesgo</th>
              <th>Tipo</th>
              <th>Probabilidad</th>
              <th>Impacto</th>
              <th>Mitigación</th>
            </tr>
          </thead>
          <tbody>
            ${data.riesgos.map(r => `
            <tr>
              <td><strong>${r.nombre}</strong></td>
              <td>${r.tipo || '-'}</td>
              <td><span class="badge badge-${r.probabilidad === 'alta' ? 'alto' : r.probabilidad === 'media' ? 'medio' : 'bajo'}">${r.probabilidad || '-'}</span></td>
              <td><span class="badge badge-${r.impacto === 'alto' ? 'alto' : r.impacto === 'medio' ? 'medio' : 'bajo'}">${r.impacto || '-'}</span></td>
              <td>${r.mitigacion || '-'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- Sección 6: Metas de Vida -->
    ${(data.metasVida && data.metasVida.length > 0) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">🎯</div>
        <div>
          <h2 class="section-title">Metas de Vida</h2>
          <p class="section-subtitle">Tus objetivos financieros a futuro</p>
        </div>
      </div>

      <div class="cards-grid">
        ${data.metasVida.map(meta => `
        <div class="instrument-card">
          <div class="header">
            <span class="name">${meta.nombre}</span>
            <span class="badge badge-${meta.prioridad === 'alta' ? 'alto' : meta.prioridad === 'media' ? 'medio' : 'bajo'}">${meta.prioridad || 'media'}</span>
          </div>
          <p class="type">${meta.montoObjetivo ? `USD ${meta.montoObjetivo.toLocaleString()}` : 'Sin monto definido'}</p>
          ${meta.fechaEstimada ? `<p class="objetivo">Fecha estimada: ${new Date(meta.fechaEstimada).toLocaleDateString('es-AR')}</p>` : ''}
          ${meta.notes ? `<p class="objetivo" style="margin-top: 8px;">${meta.notes}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Sección 7: Consejo Final -->
    <div class="consejo-box">
      <h4>💡 Consejo de tu Asesor</h4>
      <p>${data.consejoFinal || data.usarConsejoIA ? `Empezar a invertir joven es la mejor decisión financiera que podés tomar. No busques la perfección, buscá la consistencia. Con tiempo y disciplina, incluso aportes pequeños pueden crecer significativamente.` : ''}
      ${data.observaciones ? `<p style="margin-top: 15px; font-size: 14px; opacity: 0.9;">Notas adicionales: ${data.observaciones}</p>` : ''}</p>
      <div class="consejo-footer">Recordá revisar tu plan cada 6 meses para ajustarlo según tus necesidades cambiantes.</div>
    </div>

    <!-- Footer con Links -->
    <div class="footer">
      <div class="footer-header">
        <h4>📞 Contactá a tu Asesor</h4>
        <p>Seguime en redes para tips financieros</p>
      </div>

      ${showRecomendaciones ? `
      <div class="recommend-box" style="margin-bottom: 24px;">
        <span class="icon">🌟</span>
        <p>
          Si este plan te pareció útil, <strong>compartilo</strong> Recomendá a <strong>${asesorNombre}</strong> con amigos y familiares.
          Las referencias nos ayudan a seguir creciendo y llevando planificación financiera a más personas.
        </p>
      </div>` : ''}

      <div class="footer-links">
        ${socialLinksHTML}
      </div>
      <div class="footer-disclaimer">
        <p>Plan financiero generado el ${fecha}</p>
        <p>Este documento es orientativo y no constituye asesoramiento financiero personalizado. Consultá con un profesional antes de tomar decisiones de inversión.</p>
        <p style="margin-top: 12px;">${webUrl}</p>
        <p style="margin-top: 24px; font-size: 10px; font-weight: bold; color: #A0ACA5;">Powered by MaatWork</p>
      </div>
    </div>
  </div>
  ${floatingWhatsappHTML}

  ${(data.attachedFiles && data.attachedFiles.length > 0) ? `
  <div style="page-break-before: always;" class="html2pdf__page-break"></div>
  <div class="page-container" style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
    <div class="header" style="margin-bottom: 40px; text-align: center;">
      ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" style="max-height: 60px; margin: 0 auto; display: block; margin-bottom: 15px;" />` : `<div class="header-logo" style="justify-content: center; margin-bottom: 10px; font-weight: bold; font-size: 24px; color: var(--primary-dark);">MaatWork</div>`}
      <div class="header-title" style="text-align: center;">Model Portfolios</div>
    </div>
    <div class="content" style="flex: 1; display: flex; align-items: center; justify-content: center;">
      <div class="section" style="width: 100%; max-width: 600px; margin: 0 auto; box-shadow: none; border: none; background: transparent;">
        <div class="card" style="margin-top: 40px; text-align: center; padding: 60px 40px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E8E6E0; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="font-size: 64px; margin-bottom: 24px;">📄</div>
          <h2 style="color: var(--primary-dark); font-size: 28px; margin-bottom: 16px; font-weight: 800;">Documentos y Proyecciones</h2>
          <p style="color: #333333; font-size: 16px; line-height: 1.6; max-width: 400px; margin: 0 auto;">
            A continuación se adjuntan las proyecciones detalladas y la documentación técnica relacionada con este plan financiero.
          </p>
        </div>
      </div>
    </div>
  </div>
  ` : ''}
</body>
</html>`;
}
