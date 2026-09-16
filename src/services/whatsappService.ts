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
