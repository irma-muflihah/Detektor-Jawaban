import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#2563eb', // Blue 600
          secondary: '#0f172a', // Slate 900
          accent: '#2563eb', // Blue 600
          surface: '#ffffff',
          background: '#f8fafc', // Slate 50
          error: '#ef4444',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
        },
      },
      dark: {
        colors: {
          primary: '#3b82f6', // Blue 500
          secondary: '#1e293b', // Slate 800
          accent: '#3b82f6', // Blue 500
          surface: '#0f172a',
          background: '#020617', // Slate 950
        },
      },
    },
  },
});
