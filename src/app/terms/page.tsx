import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — MaatWork CRM",
  description: "Términos y condiciones de uso de MaatWork CRM. Acuerdo entre el usuario y MaatWork Team.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#08090B] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-violet-400 mb-8">Términos y Condiciones</h1>
        <p className="text-sm text-slate-500 mb-8">Última actualización: 6 de abril de 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y usar <strong>MaatWork CRM</strong> (en adelante, &quot;la Plataforma&quot;), aceptás bindarte a estos Términos y Condiciones (en adelante, &quot;Términos&quot;). Si no aceptás estos Términos en su totalidad, no debés usar la Plataforma.
            </p>
            <p className="mt-2">
              El uso de la Plataforma se ofrece sujeto a la aceptación sin modificaciones de estos Términos, junto con la Política de Privacidad disponible en <a href="/privacy-policy" className="text-violet-400 underline">/privacy-policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Descripción del Servicio</h2>
            <p>
              MaatWork CRM es una aplicación web de gestión de relaciones con clientes que incluye:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Gestión de contactos y empresas</li>
              <li>Pipeline de ventas (embudo comercial)</li>
              <li>Administración de tareas y equipos</li>
              <li>Sincronización con Google Calendar</li>
              <li>Reporting y métricas de gestión comercial</li>
            </ul>
            <p className="mt-3">
              MaatWork es un producto de <strong>MaatWork Team</strong>, una iniciativa de software factory con domicilio en la <strong>República Argentina</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Elegibilidad</h2>
            <p>
              La Plataforma está dirigida a profesionales y empresas que necesiten gestionar sus relaciones con clientes. Debés:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Tener al menos 18 años de edad</li>
              <li>Tener capacidad legal para celebrar contratos</li>
              <li>No estar impedido por la ley de usar nuestros servicios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Cuenta de Usuario y Registro</h2>
            <p>
              Para acceder a la Plataforma podés registrarte usando:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Cuenta de Google:</strong> mediante OAuth 2.0. Al usar este método, autorizás a MaatWork a acceder a tu email, perfil básico y (opcionalmente) Google Calendar.</li>
              <li><strong>Credenciales propias:</strong> email y contraseña creados directamente en la Plataforma.</li>
            </ul>
            <p className="mt-3">
              Sos responsable de mantener la confidencialidad de tus credenciales y de toda actividad que ocurra bajo tu cuenta. Notificános inmediatamente si detectás acceso no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Integración con Google Calendar</h2>
            <p>
              La función de sincronización de calendario de MaatWork:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Es <strong>optativa</strong>. Podés usar MaatWork CRM sin conectar tu cuenta de Google.</li>
              <li>Al conectarla, autorizás a MaatWork a acceder a tus eventos de Google Calendar con acceso de solo lectura (a menos que uses la función de sync bidireccional).</li>
              <li><strong>No almacenamos el contenido de tus eventos</strong> más allá de los metadatos necesarios para la sincronización (título, fecha, hora, estado).</li>
              <li>Podés revocar el acceso en cualquier momento desde la sección &quot;Cuentas Vinculadas&quot; o desde tu cuenta de Google.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Uso Aceptable</h2>
            <p>Te comprometés a NO usar la Plataforma para:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Actividades ilegales o que violen derechos de terceros</li>
              <li>Enviar spam, malware o contenido malicioso</li>
              <li>Suplantar la identidad de otra persona</li>
              <li>Intentar acceder no autorizado a sistemas externos conectados</li>
              <li>Realizar ingeniería inversa del software</li>
              <li>Usar la Plataforma para hostigar, difamar o discriminar a terceros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Propiedad Intelectual</h2>
            <p>
              El software, diseño, logos, marcas y todo contenido de MaatWork CRM es propiedad de <strong>MaatWork Team</strong> y está protegido por las leyes de propiedad intelectual argentinas e internacionales.
            </p>
            <p className="mt-2">
              Vos conservés la propiedad de los datos que cargás en la Plataforma (&quot;Contenido del Usuario&quot;). Al usar la Plataforma, nos otorgás una licencia limitada para usar tu Contenido únicamente con el propósito de prestar el servicio contratado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Disponibilidad del Servicio</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>No garantizamos disponibilidad continua e ininterrumpida de la Plataforma.</li>
              <li>Podemos realizar mantenimiento planificado con aviso previo cuando sea posible.</li>
              <li>Pueden ocurrir interrupciones no planificadas debido a circunstancias fuera de nuestro control.</li>
              <li>No somos responsables por pérdidas derivadas de interrupciones del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Limitación de Responsabilidad</h2>
            <p>
              En la máxima medida permitida por la ley aplicable, <strong>MaatWork Team</strong> no será responsable por:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Daños indirectos, incidentales, especiales o consecuentes</li>
              <li>Pérdida de datos, ganancias, oportunidades de negocio o reputación</li>
              <li>Daños derivados del uso de información obtenida a través de la Plataforma</li>
              <li>Acciones de terceros, incluyendo otros usuarios</li>
            </ul>
            <p className="mt-3">
              La responsabilidad total de MaatWork por cualquier reclamo no excederá el monto que hayas pagado por el servicio en los últimos 12 meses, o $10.000 USD, lo que sea menor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Indemnización</h2>
            <p>
              Aceptás indemnify y mantener indemne a MaatWork Team, sus directivos, empleados y agentes de cualquier reclamo, demanda, daño o gasto (incluyendo honorarios legales) que surja de tu uso de la Plataforma o de tu violación de estos Términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Modificaciones a los Términos</h2>
            <p>
              Podemos modificar estos Términos en cualquier momento. Los cambios significativos serán notificados mediante:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Un aviso visible en la Plataforma al próximo inicio de sesión</li>
              <li>Email a la dirección asociada a tu cuenta</li>
            </ul>
            <p className="mt-3">
              Si continuás usando la Plataforma después de la notificación de cambios, se considerará que aceptás los nuevos Términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Terminación</h2>
            <p>
              Podés terminar tu cuenta en cualquier momento desde la configuración de la Plataforma. Nosotros podemos suspender o terminar tu acceso:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Si violás estos Términos</li>
              <li>Si dejamos de ofrecer la Plataforma</li>
              <li>Si lo requiere la ley</li>
            </ul>
            <p className="mt-3">
              Tras la terminación, retendremos tus datos según lo detallado en la Política de Privacidad, y podrás solicitar la exportación o eliminación de tus datos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de la <strong>República Argentina</strong>.
            </p>
            <p className="mt-2">
              Cualquier controversia derivada del uso de la Plataforma estará sujeta a la jurisdicción exclusiva de los tribunales ordinarios de la Ciudad de Buenos Aires, Argentina, renunciando expresamente a cualquier otra jurisdicción que pudiera corresponder.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Contacto</h2>
            <p>Para cualquier pregunta sobre estos Términos:</p>
            <p className="mt-2">
              <strong>Email:</strong> giolivosantarelli@gmail.com
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <a href="/privacy-policy" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
            ← Ver Política de Privacidad
          </a>
        </div>
      </div>
    </div>
  );
}
