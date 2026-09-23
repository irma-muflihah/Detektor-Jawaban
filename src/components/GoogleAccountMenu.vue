<template>
  <div class="d-inline-flex align-center">
    <!-- JIKA SUDAH LOGIN KE GOOGLE -->
    <v-menu v-if="currentUser" location="bottom end" transition="scale-transition">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="tonal"
          color="primary"
          rounded="pill"
          size="small"
          class="text-none font-weight-bold px-3 mr-2"
        >
          <template v-slot:prepend>
            <v-avatar size="22" class="mr-1">
              <v-img v-if="currentUser.photoURL" :src="currentUser.photoURL" alt="Avatar"></v-img>
              <v-icon v-else size="16">mdi-account-circle</v-icon>
            </v-avatar>
          </template>
          <span class="d-none d-sm-inline">{{ currentUser.displayName || currentUser.email?.split('@')[0] }}</span>
          <v-icon size="16" class="ml-1">mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-card min-width="260" class="rounded-xl pa-3 border elevation-3">
        <div class="d-flex align-center gap-3 mb-3 pa-2 bg-grey-lighten-4 rounded-lg">
          <v-avatar size="40" color="primary">
            <v-img v-if="currentUser.photoURL" :src="currentUser.photoURL"></v-img>
            <span v-else class="text-white font-weight-bold">{{ (currentUser.displayName || 'G')[0] }}</span>
          </v-avatar>
          <div class="overflow-hidden">
            <div class="font-weight-bold text-body-2 text-truncate">{{ currentUser.displayName || 'Akun Google' }}</div>
            <div class="text-caption text-grey text-truncate">{{ currentUser.email }}</div>
          </div>
        </div>

        <div class="d-flex align-center gap-2 mb-3 px-2">
          <v-icon size="18" color="success">mdi-cloud-check</v-icon>
          <span class="text-caption text-grey-darken-2 font-weight-medium">Google Drive Siap Digunakan</span>
        </div>

        <v-divider class="mb-2"></v-divider>

        <v-btn
          block
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-logout"
          class="text-none font-weight-bold rounded-lg"
          @click="handleSignOut"
        >
          Keluar dari Akun Google
        </v-btn>
      </v-card>
    </v-menu>

    <!-- JIKA BELUM LOGIN: TAMPILKAN TOMBOL RESMI GOOGLE -->
    <div v-else class="d-inline-flex mr-2">
      <v-btn
        color="surface"
        variant="outlined"
        rounded="pill"
        size="small"
        class="text-none font-weight-bold text-grey-darken-3 border"
        :loading="isSigningIn"
        @click="handleSignIn"
        title="Hubungkan Google Drive untuk memindai LJK langsung dari cloud"
      >
        <template v-slot:prepend>
          <svg style="width: 16px; height: 16px;" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
        </template>
        <span class="d-none d-sm-inline">Google Drive</span>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { User } from 'firebase/auth';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  auth
} from '../services/googleDrivePickerService';
import { useOmrStore } from '../store/omrStore';

const omrStore = useOmrStore();
const currentUser = ref<User | null>(null);
const isSigningIn = ref(false);

onMounted(() => {
  initGoogleAuth(
    (user) => {
      currentUser.value = user;
    },
    () => {
      currentUser.value = auth.currentUser;
    }
  );
  currentUser.value = auth.currentUser;
});

const handleSignIn = async () => {
  isSigningIn.value = true;
  try {
    const res = await signInWithGoogle();
    currentUser.value = res.user;
    omrStore.showToast(`Berhasil login sebagai ${res.user.displayName || res.user.email}`, 'success');
  } catch (err: any) {
    if (!err.message?.includes('popup-closed-by-user')) {
      omrStore.showToast(`Gagal login Google: ${err.message}`, 'error');
    }
  } finally {
    isSigningIn.value = false;
  }
};

const handleSignOut = async () => {
  try {
    await signOutGoogle();
    currentUser.value = null;
    omrStore.showToast('Berhasil keluar dari akun Google.', 'info');
  } catch (err: any) {
    omrStore.showToast(`Gagal logout: ${err.message}`, 'error');
  }
};
</script>
