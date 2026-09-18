// Servicio Frontend de IA y Gestión de Contenidos Dinámicos
// Club Deportivo de Ajedrez Capablanca Sabaneta
// Las llamadas a LLM se dirigen exclusivamente a la Edge Function server-side 'ai-proxy'

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  AIProvider,
  AIProviderSetting,
  ContentBlock,
  ContentBlockPage,
  AIProxyRequest,
  AIProxyResponse,
} from '../types/database';
import { INITIAL_AI_PROVIDERS, INITIAL_CONTENT_BLOCKS } from '../lib/initialData';

class AIService {
  private localProviders: AIProviderSetting[] = [...INITIAL_AI_PROVIDERS];
  private localBlocks: ContentBlock[] = [...INITIAL_CONTENT_BLOCKS];
  private aiModeStorageKey = 'capablanca_modo_ai_active';

  // =========================================================================
  // GESTIÓN DEL MODO AI GLOBAL
  // =========================================================================

  public isAIModeActive(): boolean {
    const stored = localStorage.getItem(this.aiModeStorageKey);
    return stored === null ? true : stored === 'true';
  }

  public setAIModeActive(active: boolean): void {
    localStorage.setItem(this.aiModeStorageKey, active ? 'true' : 'false');
  }

  // =========================================================================
  // INVOCACIÓN DE LLM (EDGE FUNCTION AI-PROXY)
  // =========================================================================

  public async generateText(request: AIProxyRequest): Promise<AIProxyResponse> {
    const {
      prompt,
      systemPrompt,
      provider = 'gemini',
      model,
      feature = 'general',
      maxTokens = 1000,
      temperature = 0.7,
    } = request;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
          body: {
            prompt,
            systemPrompt,
            provider,
            model,
            feature,
            maxTokens,
            temperature,
          },
        });

        if (!error && data && data.success) {
          return data as AIProxyResponse;
        }

        if (error || (data && data.error)) {
          console.warn('ai-proxy Edge Function retornó error, recurriendo a respuesta pedagógica:', error || data?.error);
        }
      } catch (err) {
        console.warn('Error de conectividad al invocar ai-proxy:', err);
      }
    }

    // Fallback pedagógico e institucional para desarrollo local
    await new Promise((resolve) => setTimeout(resolve, 800));

    let mockText = '';
    if (feature === 'blog_writer') {
      mockText = `### Crónica Ajedrecística: Excelencia y Pasión en Sabaneta\n\nEl Club de Ajedrez Capablanca continúa fortaleciendo el pensamiento estratégico y la formación integral de nuestros jóvenes talentos. Con base en la premisa: "${prompt.slice(0, 80)}...", nuestros maestros destacan la importancia de la perseverancia en el cálculo y el respeto deportivo en cada partida disputada en nuestra sede de CC Aves María.`;
    } else if (feature === 'web_editor') {
      mockText = `Comprometidos con el desarrollo integral a través del ajedrez, en el Club Capablanca de Sabaneta formamos deportistas éticos, reflexivos y perseverantes listos para brillar a nivel municipal, departamental y federado FIDE.`;
    } else {
      mockText = `[Respuesta generada por el Asistente Capablanca (${provider} / ${model || 'default'})]\n\nBasado en la instrucción: "${prompt.slice(0, 100)}...", el club recomienda mantener el enfoque en los principios clásicos de José Raúl Capablanca: desarrollo armónico, seguridad del rey y juego activo de piezas.`;
    }

    return {
      success: true,
      text: mockText,
      provider,
      model: model || 'modo-desarrollo-local',
      feature,
      timestamp: new Date().toISOString(),
    };
  }

  // =========================================================================
  // GESTIÓN DE CONFIGURACIÓN DE PROVEEDORES (ai_provider_settings)
  // =========================================================================

  public async getProviderSettings(): Promise<AIProviderSetting[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('ai_provider_settings')
          .select('*')
          .order('provider');

        if (!error && data && data.length > 0) {
          this.localProviders = data as AIProviderSetting[];
          return this.localProviders;
        }
      } catch (err) {
        console.warn('Error al cargar ai_provider_settings de Supabase:', err);
      }
    }

    return this.localProviders;
  }

  public async updateProviderSetting(
    id: string,
    updates: Partial<AIProviderSetting>
  ): Promise<AIProviderSetting | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('ai_provider_settings')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          this.localProviders = this.localProviders.map((p) => (p.id === id ? (data as AIProviderSetting) : p));
          return data as AIProviderSetting;
        }
      } catch (err) {
        console.error('Error al actualizar ai_provider_settings en Supabase:', err);
      }
    }

    this.localProviders = this.localProviders.map((p) =>
      p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
    );
    return this.localProviders.find((p) => p.id === id) || null;
  }

  // =========================================================================
  // GESTIÓN DE BLOQUES DE CONTENIDO (content_blocks)
  // =========================================================================

  public async getContentBlocks(page?: ContentBlockPage): Promise<ContentBlock[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('content_blocks').select('*').order('section_key');
        if (page) {
          query = query.eq('page', page);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          if (!page) {
            this.localBlocks = data as ContentBlock[];
          }
          return data as ContentBlock[];
        }
      } catch (err) {
        console.warn('Error al cargar content_blocks de Supabase:', err);
      }
    }

    if (page) {
      return this.localBlocks.filter((b) => b.page === page);
    }
    return this.localBlocks;
  }

  public async upsertContentBlock(
    block: Omit<ContentBlock, 'id'> & { id?: string }
  ): Promise<ContentBlock | null> {
    const payload = {
      page: block.page,
      section_key: block.section_key,
      value_type: block.value_type,
      value: block.value,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('content_blocks')
          .upsert(payload, { onConflict: 'page,section_key' })
          .select()
          .single();

        if (!error && data) {
          const updated = data as ContentBlock;
          const idx = this.localBlocks.findIndex((b) => b.page === block.page && b.section_key === block.section_key);
          if (idx >= 0) {
            this.localBlocks[idx] = updated;
          } else {
            this.localBlocks.push(updated);
          }
          return updated;
        }
      } catch (err) {
        console.error('Error al hacer upsert de content_blocks en Supabase:', err);
      }
    }

    const existingIdx = this.localBlocks.findIndex(
      (b) => b.page === block.page && b.section_key === block.section_key
    );
    const newOrUpdated: ContentBlock = {
      id: block.id || `cb-local-${Date.now()}`,
      page: block.page,
      section_key: block.section_key,
      value_type: block.value_type,
      value: block.value,
      updated_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.localBlocks[existingIdx] = newOrUpdated;
    } else {
      this.localBlocks.push(newOrUpdated);
    }

    return newOrUpdated;
  }

  public async deleteContentBlock(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('content_blocks').delete().eq('id', id);
        if (!error) {
          this.localBlocks = this.localBlocks.filter((b) => b.id !== id);
          return true;
        }
      } catch (err) {
        console.error('Error al eliminar content_block en Supabase:', err);
      }
    }

    this.localBlocks = this.localBlocks.filter((b) => b.id !== id);
    return true;
  }
}

export const aiService = new AIService();
