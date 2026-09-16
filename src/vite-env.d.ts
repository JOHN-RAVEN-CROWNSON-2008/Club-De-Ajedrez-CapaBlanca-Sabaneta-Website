/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_RESEND_API_KEY: string;
  readonly VITE_RESEND_FROM_EMAIL: string;
  readonly VITE_WHATSAPP_PHONE: string;
  readonly VITE_WHATSAPP_API_TOKEN: string;
  readonly VITE_WHATSAPP_PHONE_NUMBER_ID: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_PUBLIC_PORT: string;
  readonly VITE_ADMIN_PORT: string;
  readonly VITE_MEMBERS_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
