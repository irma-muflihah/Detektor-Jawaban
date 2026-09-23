import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Inisialisasi Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Provider Google dengan scope Google Drive
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache token akses di memori (sesuai panduan keamanan Workspace)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Menginisialisasi pendengar status otentikasi Google
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token di memori telah hilang (misal setelah refresh), perlu login interaktif jika ingin akses Drive
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Melakukan proses Sign-in dengan Google untuk mendapatkan Access Token
 */
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh OAuth Access Token dari Google Auth.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Google Auth] Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Mengambil Access Token Google dari cache memori
 */
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Logout dari Google
 */
export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Memuat library Google API (gapi) dan Picker API ke DOM
 */
let gapiLoadPromise: Promise<void> | null = null;
export const loadGooglePickerScript = (): Promise<void> => {
  if (gapiLoadPromise) return gapiLoadPromise;

  gapiLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not found'));

    // Cek jika gapi.picker sudah tersedia
    if ((window as any).gapi && (window as any).google?.picker) {
      return resolve();
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const gapi = (window as any).gapi;
      if (!gapi) return reject(new Error('GAPI script loaded but window.gapi is undefined'));
      gapi.load('picker', {
        callback: () => {
          resolve();
        },
        onerror: () => {
          reject(new Error('Gagal memuat Google Picker API'));
        }
      });
    };
    script.onerror = (err) => reject(new Error('Gagal mengunduh script Google API: ' + err));
    document.body.appendChild(script);
  });

  return gapiLoadPromise;
};

export interface PickedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  file: File;
  dataUrl: string;
}

/**
 * Mengunduh berkas gambar dari Google Drive API dengan Access Token
 */
export async function downloadDriveFile(fileId: string, fileName: string, mimeType: string, token: string): Promise<PickedDriveFile> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal mengunduh file "${fileName}" dari Google Drive (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  const file = new File([blob], fileName, { type: mimeType || blob.type || 'image/jpeg' });

  // Convert to DataURL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return {
    id: fileId,
    name: fileName,
    mimeType: file.type,
    file,
    dataUrl
  };
}

/**
 * Mengambil daftar berkas gambar yang ada di dalam sebuah folder Google Drive
 */
export async function listFilesInDriveFolder(folderId: string, token: string): Promise<Array<{ id: string; name: string; mimeType: string }>> {
  const query = `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = 'application/pdf')`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&pageSize=100`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Gagal membaca folder Google Drive (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Membuka Google Picker Dialog untuk memilih berkas gambar LJK atau folder dari Google Drive
 */
export async function openGoogleDrivePicker(
  onFilesSelected: (files: PickedDriveFile[]) => void,
  onError: (error: string) => void,
  onProgress?: (statusText: string) => void
): Promise<void> {
  try {
    // 1. Pastikan pengguna sudah terotentikasi & memiliki token
    let token = getGoogleAccessToken();
    if (!token) {
      if (onProgress) onProgress('Meminta otorisasi akun Google...');
      const authRes = await signInWithGoogle();
      token = authRes.accessToken;
    }

    if (!token) {
      throw new Error('Token akses Google Drive tidak tersedia. Silakan Sign In kembali.');
    }

    // 2. Pastikan Google Picker script sudah terpasang
    if (onProgress) onProgress('Menyiapkan Google Picker...');
    await loadGooglePickerScript();

    const google = (window as any).google;
    if (!google?.picker) {
      throw new Error('Google Picker library tidak berhasil diinisialisasi.');
    }

    // 3. Bangun Views untuk gambar dan folder
    const imagesView = new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES)
      .setMimeTypes('image/jpeg,image/png,image/webp,image/jpg,application/pdf')
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);

    const foldersView = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);

    const picker = new google.picker.PickerBuilder()
      .addView(imagesView)
      .addView(foldersView)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(token)
      .setDeveloperKey(firebaseConfig.apiKey)
      .setAppId(firebaseConfig.appId)
      .setTitle('Pilih Berkas Citra LJK atau Folder dari Google Drive')
      .setLocale('id')
      .setCallback(async (data: any) => {
        if (data.action === google.picker.Action.PICKED) {
          const docs = data.docs || [];
          if (docs.length === 0) return;

          try {
            if (onProgress) onProgress(`Memproses ${docs.length} item terpilih dari Google Drive...`);
            const results: PickedDriveFile[] = [];

            for (let i = 0; i < docs.length; i++) {
              const doc = docs[i];
              const isFolder = doc.mimeType === 'application/vnd.google-apps.folder';

              if (isFolder) {
                if (onProgress) onProgress(`Membaca isi folder "${doc.name}"...`);
                const childFiles = await listFilesInDriveFolder(doc.id, token!);
                
                if (childFiles.length === 0) {
                  console.warn(`Folder "${doc.name}" tidak memiliki file gambar.`);
                  continue;
                }

                for (let j = 0; j < childFiles.length; j++) {
                  const child = childFiles[j];
                  if (onProgress) onProgress(`Mengunduh (${j + 1}/${childFiles.length}): ${child.name}...`);
                  const downloaded = await downloadDriveFile(child.id, child.name, child.mimeType, token!);
                  results.push(downloaded);
                }
              } else {
                if (onProgress) onProgress(`Mengunduh (${i + 1}/${docs.length}): ${doc.name}...`);
                const downloaded = await downloadDriveFile(doc.id, doc.name, doc.mimeType, token!);
                results.push(downloaded);
              }
            }

            if (results.length > 0) {
              onFilesSelected(results);
            } else {
              onError('Tidak ada berkas gambar LJK yang ditemukan pada folder/item yang dipilih.');
            }
          } catch (fetchErr: any) {
            console.error('[Google Picker] Gagal mengunduh file:', fetchErr);
            onError(`Gagal mengunduh berkas dari Google Drive: ${fetchErr.message || fetchErr}`);
          }
        }
      })
      .build();

    picker.setVisible(true);
  } catch (err: any) {
    console.error('[Google Picker] Error:', err);
    onError(`Gagal membuka Google Drive Picker: ${err.message || err}`);
  }
}
