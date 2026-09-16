// Servicio para el envío de correos electrónicos transaccionales usando Resend API

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export const resendService = {
  getApiKey(): string {
    return import.meta.env.VITE_RESEND_API_KEY || '';
  },

  getFromEmail(): string {
    return import.meta.env.VITE_RESEND_FROM_EMAIL || 'notificaciones@ajedrezcapablanca.com';
  },

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key) && !key.includes('tu_api_key') && key.startsWith('re_');
  },

  /**
   * Envía un correo transaccional utilizando la API HTTP directa de Resend
   */
  async sendEmail({ to, subject, html, text }: EmailPayload): Promise<{ success: boolean; data?: unknown; error?: string }> {
    if (!this.isConfigured()) {
      console.info('[Resend Simulado] Correo simulado exitosamente:', { to, subject });
      return { success: true, data: { id: 'simulated-resend-id-' + Date.now() } };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.getFromEmail(),
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ''),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar correo vía Resend');
      }

      return { success: true, data: result };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido en Resend';
      console.error('[Resend Error]', errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Plantilla para bienvenida de nuevo afiliado
   */
  async sendWelcomeEmail(to: string, userName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 24px; border-radius: 8px;">
        <h1 style="color: #F5C518; margin-bottom: 8px;">¡Bienvenido a la Familia Capablanca!</h1>
        <p style="font-size: 16px; color: #ccc;">Hola <strong>${userName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #e0e0e0;">
          Tu cuenta en el <strong>Portal de Afiliados del Club Deportivo de Ajedrez Capablanca Sabaneta</strong> ha sido activada con éxito.
        </p>
        <div style="margin: 20px 0; padding: 16px; background-color: #1a1a1a; border-left: 4px solid #F5C518; border-radius: 4px;">
          <p style="margin: 0; color: #fff;">Desde ahora puedes consultar material de estudio exclusivo, bases PGN, circulares oficiales e inscribirte a nuestros torneos con un solo clic.</p>
        </div>
        <p style="font-size: 14px; color: #888;">Nos vemos en el tablero — CC Aves María, Sabaneta.</p>
      </div>
    `;
    return this.sendEmail({
      to,
      subject: '¡Bienvenido al Club de Ajedrez Capablanca Sabaneta!',
      html,
    });
  },

  /**
   * Plantilla para confirmación de inscripción a torneo
   */
  async sendTournamentConfirmation(to: string, userName: string, tournamentTitle: string, eventDate: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 24px; border-radius: 8px;">
        <h2 style="color: #F5C518;">Inscripción Confirmada</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Confirmamos tu preinscripción al evento: <strong>${tournamentTitle}</strong>.</p>
        <p><strong>Fecha:</strong> ${eventDate}</p>
        <p><strong>Lugar:</strong> Sede CC Aves María, tercer piso, Sabaneta.</p>
        <p style="color: #bbb;">Por favor presentarte 15 minutos antes de la primera ronda para la confirmación de asistencia ante los árbitros.</p>
      </div>
    `;
    return this.sendEmail({
      to,
      subject: `Confirmación de inscripción: ${tournamentTitle}`,
      html,
    });
  }
};
