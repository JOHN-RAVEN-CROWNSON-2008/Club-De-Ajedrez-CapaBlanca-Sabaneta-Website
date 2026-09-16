// Servicio para integración con WhatsApp: Enlaces oficiales Click-to-Chat y WhatsApp Cloud API

export const whatsappService = {
  getPhoneNumber(): string {
    return import.meta.env.VITE_WHATSAPP_PHONE || '573002545835';
  },

  getApiToken(): string {
    return import.meta.env.VITE_WHATSAPP_API_TOKEN || '';
  },

  getPhoneNumberId(): string {
    return import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '';
  },

  /**
   * Genera la URL oficial de WhatsApp con mensaje precargado codificado
   */
  getChatUrl(message?: string, customPhone?: string): string {
    const phone = customPhone || this.getPhoneNumber();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultMsg = 'Hola, vengo de la página web del Club Capablanca Sabaneta y quiero más información.';
    const text = encodeURIComponent(message || defaultMsg);
    return `https://wa.me/${cleanPhone}?text=${text}`;
  },

  /**
   * Abre directamente la ventana de WhatsApp en una nueva pestaña
   */
  openChat(message?: string, customPhone?: string) {
    const url = this.getChatUrl(message, customPhone);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Envía recordatorio personalizado de torneo a un atleta
   */
  openTournamentReminder(phone: string, athleteName: string, tournamentTitle: string, date: string, time: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const msg = `¡Hola ${athleteName}! ♟️ Te recordamos cordialmente desde el Club Deportivo de Ajedrez Capablanca Sabaneta que estás confirmado para el torneo "${tournamentTitle}" este ${date} a las ${time} en la sede CC Aves María (piso 3). Por favor preséntate 15 minutos antes para la conformación de mesas. ¡Muchos éxitos en tus partidas!`;
    this.openChat(msg, fullPhone);
  },

  /**
   * Envía recordatorio o notificación de pago de cuota
   */
  openPaymentReminder(phone: string, athleteName: string, period: string, amount: number) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const formattedAmount = `$${amount.toLocaleString('es-CO')}`;
    const msg = `Hola ${athleteName}, te saludamos desde la administración del Club Capablanca Sabaneta ♞. Te informamos que tu cuota de afiliación del periodo ${period} (${formattedAmount}) se encuentra en proceso. Puedes reportar o consultar tus recibos directamente en el portal oficial: https://clubcapablanca.org/afiliados`;
    this.openChat(msg, fullPhone);
  },

  /**
   * Abre respuesta directa por WhatsApp a un mensaje de contacto ciudadano
   */
  openContactReply(phone: string, citizenName: string, subject: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const msg = `Hola ${citizenName}, recibimos tu solicitud enviada a través de la web del Club de Ajedrez Capablanca Sabaneta sobre "${subject}". Con gusto te brindamos toda la información que necesitas.`;
    this.openChat(msg, fullPhone);
  },

  /**
   * Envía notificación de inasistencia a clase al acudiente o alumno
   */
  openAttendanceNotice(phone: string, studentName: string, category: string, date: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const msg = `Hola ${studentName}, te saludamos desde la coordinación técnica del Club Capablanca Sabaneta ♞. Notamos tu inasistencia a la clase de "${category}" del día ${date}. Esperamos te encuentres muy bien. Si requieres justificar la sesión o reprogramar asesoría técnica, por favor respóndenos a este mensaje.`;
    this.openChat(msg, fullPhone);
  },

  /**
   * Abre mensaje de bienvenida y citación a clase diagnóstica para una solicitud de admisión
   */
  openApplicationContact(param1: string, param2: string, category: string, applicationCode?: string) {
    let phone = param1;
    let applicantName = param2;
    // Si param2 tiene formato de teléfono (dígitos) y param1 es el nombre:
    if (param2.replace(/[^0-9]/g, '').length >= 7 && param1.replace(/[^0-9]/g, '').length < 7) {
      applicantName = param1;
      phone = param2;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const codeRef = applicationCode ? ` (Radicado: ${applicationCode})` : '';
    const msg = `¡Hola ${applicantName}! 👋 Te saludamos desde la dirección deportiva del Club de Ajedrez Capablanca Sabaneta ♞. Recibimos tu solicitud de afiliación${codeRef} para la categoría "${category}". Nos complace invitarte a nuestra sede en el CC Aves María (piso 3) para realizar tu clase diagnóstica sin costo e integrarte a los entrenamientos. ¿Qué día te gustaría venir?`;
    this.openChat(msg, fullPhone);
  },

  /**
   * Despacho a través de WhatsApp Cloud API (para automatizaciones del backend o webhook de servidor)
   */
  async sendCloudMessage(recipientPhone: string, messageText: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const token = this.getApiToken();
    const phoneId = this.getPhoneNumberId();

    if (!token || !phoneId || token.includes('tu_whatsapp')) {
      console.info('[WhatsApp API Simulado] Envío a:', recipientPhone, 'Mensaje:', messageText);
      return { success: true, data: { status: 'simulated' } };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientPhone.replace(/[^0-9]/g, ''),
          type: 'text',
          text: { body: messageText },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error en WhatsApp Cloud API');
      }

      return { success: true, data };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error en WhatsApp API';
      console.error('[WhatsApp Cloud Error]', errorMsg);
      return { success: false, error: errorMsg };
    }
  }
};
