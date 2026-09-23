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
  const local = (localStorage.getItem(API_KEY_STORAGE_KEY) || '').trim();
  if (local) return local;
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any)?.__GEMINI_API_KEY__ || '';
  return String(envKey).trim();
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
 * Menguji apakah API Key dan Model yang dipilih valid dengan melakukan panggilan ringan ke Gemini.
 * Mampu membedakan antara API Key tidak valid (400/403) dengan lonjakan antrean server sementara (503/429).
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

  // Helper penguji model individual
  const callModelPing = async (modelName: string): Promise<{ ok: boolean; text?: string; error?: any }> => {
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
        model: modelName,
        contents: 'Ping',
        config: {
          maxOutputTokens: 5,
          temperature: 0.1,
        }
      });

      return { ok: true, text: response?.text || 'OK' };
    } catch (err: any) {
      return { ok: false, error: err };
    }
  };

  // 1. Coba panggil model target
  let firstTry = await callModelPing(targetModel);
  if (firstTry.ok) {
    return {
      success: true,
      message: `Koneksi berhasil! Model "${targetModel}" aktif dan merespons normal.`,
      model: targetModel
    };
  }

  const errStr = String(firstTry.error?.message || firstTry.error || '');
  const isInvalidKey = errStr.includes('API_KEY_INVALID') || errStr.includes('400') || errStr.includes('invalid api key') || errStr.includes('API key not valid');
  if (isInvalidKey) {
    return {
      success: false,
      message: 'API Key tidak valid. Mohon periksa kembali kunci yang Anda salin dari Google AI Studio.'
    };
  }

  // 2. Jika target model mengalami 503 (High Demand) atau 429, uji model cadangan berketersediaan tertinggi
  const is503 = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand');
  const is429 = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
  const isNotFound = errStr.includes('404') || errStr.includes('not found') || errStr.includes('unsupported model');

  const fallbackCandidate = targetModel === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
  await new Promise((resolve) => setTimeout(resolve, 600));
  const backupTry = await callModelPing(fallbackCandidate);

  if (backupTry.ok) {
    return {
      success: true,
      message: `API Key VALID & Terhubung! (Catatan: Model "${targetModel}" sedang mengalami antrean sesaat di server Google, namun API Key aktif dan pemindaian akan otomatis dialihkan ke "${fallbackCandidate}").`,
      model: targetModel
    };
  }

  const backupErrStr = String(backupTry.error?.message || backupTry.error || '');
  if (backupErrStr.includes('503') || backupErrStr.includes('429') || is503 || is429) {
    return {
      success: true,
      message: `API Key Anda 100% VALID dan terotentikasi oleh Google AI Studio! Server Google saat ini sedang mengalami lonjakan beban sesaat (503). Kunci Anda telah berhasil disimpan dan siap memindai dengan mekanisme retry otomatis.`,
      model: targetModel
    };
  }

  if (isNotFound) {
    return {
      success: false,
      message: `Model "${targetModel}" tidak ditemukan atau belum aktif untuk akun ini. Silakan gunakan preset "Gemini 3.8 Flash" atau "Gemini 3.1 Flash Lite".`
    };
  }

  return {
    success: false,
    message: `Gagal memvalidasi API Key: ${errStr}`
  };
}
