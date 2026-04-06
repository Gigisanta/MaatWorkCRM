import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — MaatWork CRM",
  description: "Política de privacidad de MaatWork CRM. Cómo recolectamos, usamos y protegemos tus datos, incluyendo el acceso a tu cuenta de Google.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#08090B] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-violet-400 mb-8">Política de Privacidad</h1>
        <p className="text-sm text-slate-500 mb-8">Última actualización: 6 de abril de 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Responsable del Tratamiento</h2>
            <p>
              <strong>MaatWork CRM</strong> (en adelante, &quot;MaatWork&quot;, &quot;nosotros&quot; o &quot;la Plataforma&quot;) es una aplicación de gestión de relaciones con clientes (CRM) operada por MaatWork Team.
            </p>
            <p className="mt-2">
              <strong>Contacto:</strong> giolivosantarelli@gmail.com
            </p>
            <p className="mt-2">
              <strong>Jurisdicción:</strong> República Argentina
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Datos que Recolectamos</h2>
            <p>MaatWork recolecta los siguientes datos:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Datos de tu cuenta de Google:</strong> cuando usás &quot;Continuar con Google&quot;, recolectamos tu dirección de email, nombre completo y foto de perfil. Estos datos se usan exclusivamente para autenticación e identificación dentro de la Plataforma.
              </li>
              <li>
                <strong>Datos de calendario de Google (Google Calendar):</strong> cuando conectás tu cuenta de Google Calendar, accedemos a tus eventos de calendario únicamente con el propósito de sincronizarlos con MaatWork CRM. <strong>No almacenamos el contenido completo de tus eventos</strong>; únicamente almacenamos: título del evento, fecha y hora de inicio/fin, y estado de confirmación.
              </li>
              <li>
                <strong>Datos del CRM:</strong> información de contactos, empresas, pipeline de ventas, tareas, equipos y cualquier otro dato que cargues en la Plataforma.
              </li>
              <li>
                <strong>Datos de uso:</strong> registros de actividad, logs de autenticación y métricas de uso anónimas para mejorar la Plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Cómo Usamos tus Datos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Autenticación:</strong> usar tu cuenta de Google para iniciar sesión en MaatWork CRM.</li>
              <li><strong>Sincronización de calendario:</strong> mostrar tus eventos de Google Calendar dentro de la Plataforma para facilitar la gestión de reuniones y agendas.</li>
              <li><strong>Gestión de contactos y pipeline:</strong> organizar y dar seguimiento a tus clientes y oportunidades de venta.</li>
              <li><strong>Comunicación:</strong> enviarte notificaciones relacionadas con tu cuenta y la actividad dentro de la Plataforma.</li>
              <li><strong>Mejora del servicio:</strong> analizar métricas de uso para mejorar la experiencia y funcionalidad de la Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Acceso a Google Calendar — Alcance Limitado</h2>
            <p>
              <strong>Este es un punto crítico de nuestra política:</strong>
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Accedemos a Google Calendar <strong>únicamente</strong> para leer eventos y sincronizarlos con MaatWork CRM.</li>
              <li><strong>No modificamos, eliminamos ni creamos eventos en tu Google Calendar</strong> a menos que tú lo solicites explícitamente a través de la función de sincronización bidireccional.</li>
              <li><strong>No almacenamos el contenido completo de tus emails</strong> (no solicitamos acceso a Gmail).</li>
              <li><strong>No compartimos tus datos de calendario</strong> con ningún tercero.</li>
              <li>Los tokens de acceso a Google se almacenan encriptados y se usan únicamente para mantener la sincronización activa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Compartir Datos con Terceros</h2>
            <p>
              MaatWork <strong>no vende, alquila ni comparte</strong> tus datos personales con terceros con fines de marketing. Los únicos casos en que compartimos datos son:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Proveedores de infraestructura:</strong> Vercel (alojamiento) y Supabase (base de datos), que operan bajo estrictos acuerdos de confidencialidad.</li>
              <li><strong>Google OAuth:</strong> para autenticación, únicamente los datos necesarios (email, nombre, foto) se comparten con Google como parte del flujo OAuth estándar.</li>
              <li><strong>Requisitos legales:</strong> cuando la ley lo requiera, por ejemplo en respuesta a una orden judicial o solicitud de autoridades competentes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Retención y Eliminación de Datos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Podés eliminar tu cuenta y todos los datos asociados en cualquier momento desde la configuración de la Plataforma.</li>
              <li>Los datos de calendario sincronizados se eliminan al desvincular tu cuenta de Google o al eliminar tu cuenta.</li>
              <li>Los tokens de acceso a Google pueden revocarse en cualquier momento desde la sección &quot;Cuentas Vinculadas&quot; en Configuración, o directamente desde tu cuenta de Google en <a href="https://myaccount.google.com/permissions" className="text-violet-400 underline" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.</li>
              <li>Retenemos logs de actividad anonimizados por un período máximo de 12 meses para fines de diagnóstico y seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Tus Derechos (Ley Argentina de Protección de Datos)</h2>
            <p>En cumplimiento de la Ley Nacional de Protección de los Datos Personales (Ley 25.326), tenés los siguientes derechos:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Acceso:</strong> saber qué datos tuyos tenemos almacenados.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos (derecho al olvido).</li>
              <li><strong>Oposición:</strong> negarte al tratamiento de tus datos para ciertos fines.</li>
              <li><strong>Revocación del consentimiento:</strong> desvincular tu cuenta de Google en cualquier momento.</li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, contactanos a: <strong>giolivosantarelli@gmail.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Seguridad</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tus datos contra acceso no autorizado, pérdida o alteración, incluyendo:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Encriptación de tokens de sesión con JWE (JSON Web Encryption).</li>
              <li>Conexión obligatoria via HTTPS en todos los entornos.</li>
              <li>Tokens de acceso a Google almacenados de forma encriptada.</li>
              <li>Control de acceso basado en roles dentro de la Plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Cookies</h2>
            <p>
              MaatWork usa cookies esenciales para el funcionamiento de la sesión de autenticación ( NextAuth.js). No usamos cookies de seguimiento ni cookies de terceros con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Cambios a esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Cualquier cambio significativo será notificado mediante un aviso visible en la Plataforma o por email a la dirección asociada a tu cuenta.
            </p>
            <p className="mt-2">
              La fecha de última actualización siempre figura al inicio de este documento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contactez</h2>
            <p>Para cualquier pregunta sobre esta Política de Privacidad o el tratamiento de tus datos:</p>
            <p className="mt-2">
              <strong>Email:</strong> giolivosantarelli@gmail.com
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <a href="/terms" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
            ← Ver Términos y Condiciones
          </a>
        </div>
      </div>
    </div>
  );
}
