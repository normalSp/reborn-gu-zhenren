import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/node_modules/react/') || normalized.includes('/node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (
            normalized.includes('/node_modules/framer-motion/') ||
            normalized.includes('/node_modules/gsap/') ||
            normalized.includes('/node_modules/recharts/') ||
            normalized.includes('/node_modules/@tanstack/react-query/') ||
            normalized.includes('/node_modules/zod/') ||
            normalized.includes('/node_modules/zustand/')
          ) {
            return 'ui-vendor';
          }
          if (normalized.includes('/src/canon/chapters.json')) return 'canon-chapters';
          if (normalized.includes('/src/canon/npcs.json')) return 'canon-npcs';
          if (
            normalized.includes('/src/canon/gu-database.json') ||
            normalized.includes('/src/canon/immortal-gu.json') ||
            normalized.includes('/src/canon/killer-moves.json') ||
            normalized.includes('/src/canon/gu-use-registry.json') ||
            normalized.includes('/src/canon/fragment-recipes.json')
          ) {
            return 'canon-gu';
          }
          if (normalized.includes('/src/canon/')) return 'canon-core';
          if (normalized.includes('/src/engine/audio') || normalized.includes('/src/utils/audio')) return 'audio';
          if (
            normalized.includes('/src/engine/combat') ||
            normalized.includes('/src/engine/squad') ||
            normalized.includes('/src/components/game/CombatOverlay') ||
            normalized.includes('/src/components/game/SquadCombatOverlay') ||
            normalized.includes('/src/components/game/BattleFlashOverlay')
          ) {
            return 'combat-squad';
          }
          if (normalized.includes('/src/engine/')) return 'engine';
        },
      },
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
});
