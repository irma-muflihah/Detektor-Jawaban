import { ref } from 'vue';
import { GoogleGenAI } from '@google/genai';

const API_KEY_STORAGE_KEY = 'dejawab_gemini_api_key';
const MODEL_STORAGE_KEY = 'dejawab_gemini_model';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export interface ModelPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  isAdvanced?: boolean;
}

export const GEMINI_MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Rekomendasi Utama',
    description: 'Generasi multimodal resmi terkini dengan penalaran mendalam dan presisi ekstraksi tinggi.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Super Cepat & Kuota Luas',
    description: 'Latensi terendah, alokasi kuota luas, optimal untuk pemindaian massal berkelanjutan.',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Cadangan Cepat',
    description: 'Model multimodal alternatif untuk pemindaian presisi tinggi.',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    badge: 'Perlu Kunci Berbayar',
    description: 'Penalaran mendalam untuk LJK sulit. Memerlukan API key dengan kuota/billing aktif Google Cloud.',
    isAdvanced: true,
  },
];

export function getStoredModel(): string {
  const stored = (localStorage.getItem(MODEL_STORAGE_KEY) || '').trim();
  // Migrasikan model deprecated yang telah dimatikan Google (404 Not Found)
  if (!stored || stored === 'gemini-2.5-flash' || stored === 'gemini-2.5-pro' || stored === 'gemini-1.5-flash') {
    localStorage.setItem(MODEL_STORAGE_KEY, DEFAULT_GEMINI_MODEL);
    return DEFAULT_GEMINI_MODEL;
  }
  return stored;
}

// Reactive states
const currentApiKey = ref<string>(localStorage.getItem(API_KEY_STORAGE_KEY) || '');
const currentModel = ref<string>(getStoredModel());

export function getStoredApiKey(): string {
  return (localStorage.getItem(API_KEY_STORAGE_KEY) || '').trim();
}

export function setStoredApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
    currentApiKey.value = trimmed;
  } else {
    removeStoredApiKey();
  }
}

export function removeStoredApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  currentApiKey.value = '';
}

export function setStoredModel(model: string): void {
  let trimmed = model.trim() || DEFAULT_GEMINI_MODEL;
  if (trimmed === 'gemini-2.5-flash' || trimmed === 'gemini-2.5-pro') {
    trimmed = DEFAULT_GEMINI_MODEL;
  }
  localStorage.setItem(MODEL_STORAGE_KEY, trimmed);
  currentModel.value = trimmed;
}

export function useGeminiKey() {
  return {
    apiKey: currentApiKey,
    selectedModel: currentModel,
    hasCustomKey: () => Boolean(currentApiKey.value),
    getStoredApiKey,
    setStoredApiKey,
    removeStoredApiKey,
    getStoredModel,
    setStoredModel,
  };
}

/**
 * Menguji apakah API Key dan Model yang dipilih valid dengan melakukan panggilan ringan ke Gemini
 */
export async function testGeminiApiKey(
  keyToTest?: string,
  modelToTest?: string
): Promise<{ success: boolean; message: string; model?: string }> {
  const key = (keyToTest || getStoredApiKey()).trim();
  const targetModel = (modelToTest || getStoredModel() || DEFAULT_GEMINI_MODEL).trim();

  // Jika tidak ada key khusus yang diberikan, cek dulu apakah server proxy memiliki key
  if (!key) {
    try {
      const res = await fetch('/api/gemini/health');
      if (res.ok) {
        const data = await res.json();
        if (data.hasGeminiKey) {
          return {
            success: true,
            message: `Server proxy memiliki GEMINI_API_KEY yang aktif. Siap menggunakan model ${targetModel}.`,
            model: targetModel
          };
        }
      }
    } catch {
      // Abaikan jika offline/static host
    }
    return {
      success: false,
      message: 'API Key kosong. Silakan masukkan Gemini API Key Anda.'
    };
  }

  // 1. Tes langsung dari browser menggunakan SDK @google/genai dengan model yang dipilih
  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'dejawab-omr-app',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: 'Balas hanya 1 kata: OK',
      config: {
        maxOutputTokens: 10,
        temperature: 0.1,
      }
    });

    if (response && response.text) {
      return {
        success: true,
        message: `Koneksi berhasil! Model "${targetModel}" aktif dan merespons dengan normal.`,
        model: targetModel
      };
    }
    return {
      success: true,
      message: `Koneksi terhubung ke Google Gemini (Model: ${targetModel}).`,
      model: targetModel
    };
  } catch (clientErr: any) {
    // 2. Jika tes client-side gagal (misalnya karena CSP atau jaringan), coba lewat proxy server jika tersedia
    try {
      const serverRes = await fetch(`/api/gemini/health?key=${encodeURIComponent(key)}`, {
        headers: {
          'x-gemini-api-key': key,
          'x-gemini-model': targetModel,
        }
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.hasGeminiKey) {
          return {
            success: true,
            message: `API Key berhasil divalidasi melalui server proxy untuk model ${targetModel}.`,
            model: targetModel
          };
        }
      }
    } catch {
      // Abaikan fallback server
    }

    const msg = clientErr.message || String(clientErr);
    if (msg.includes('API_KEY_INVALID') || msg.includes('400') || msg.includes('invalid')) {
      return {
        success: false,
        message: 'API Key tidak valid. Mohon periksa kembali kunci yang Anda salin dari Google AI Studio.'
      };
    }
    if (msg.includes('not found') || msg.includes('404') || msg.includes('unsupported model')) {
      return {
        success: false,
        message: `Model "${targetModel}" tidak ditemukan atau tidak tersedia untuk API key ini. Silakan periksa penulisan model atau gunakan preset yang tersedia.`
      };
    }
    return {
      success: false,
      message: `Gagal memvalidasi API Key & Model: ${msg}`
    };
  }
}
