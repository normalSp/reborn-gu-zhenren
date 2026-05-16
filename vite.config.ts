import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const normalizedId = (id: string) => id.replace(/\\/g, '/');
const hasAny = (id: string, patterns: string[]) => {
  const normalized = normalizedId(id);
  return patterns.some(pattern => normalized.includes(pattern));
};

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20_000,
          maxSize: 450_000,
          groups: [
            {
              name: 'react-vendor',
              test: id => hasAny(id, ['/node_modules/react/', '/node_modules/react-dom/']),
              priority: 50,
            },
            {
              name: 'ui-vendor',
              test: id => hasAny(id, [
                '/node_modules/framer-motion/',
                '/node_modules/gsap/',
                '/node_modules/recharts/',
                '/node_modules/@tanstack/react-query/',
                '/node_modules/zod/',
                '/node_modules/zustand/',
              ]),
              priority: 40,
            },
            { name: 'canon-chapters', test: id => normalizedId(id).includes('/src/canon/chapters.json'), priority: 35 },
            { name: 'canon-npcs', test: id => normalizedId(id).includes('/src/canon/npcs.json'), priority: 35 },
            {
              name: 'canon-gu',
              test: id => hasAny(id, [
                '/src/canon/gu-database.json',
                '/src/canon/immortal-gu.json',
                '/src/canon/killer-moves.json',
                '/src/canon/gu-use-registry.json',
                '/src/canon/fragment-recipes.json',
              ]),
              priority: 34,
            },
            { name: 'canon-core', test: id => normalizedId(id).includes('/src/canon/'), priority: 20 },
            {
              name: 'audio',
              test: id => hasAny(id, ['/src/engine/audio', '/src/utils/audio']),
              priority: 30,
            },
            {
              name: 'combat-squad',
              test: id => hasAny(id, ['/src/engine/combat', '/src/engine/squad']),
              priority: 30,
            },
            {
              name: 'engine-battlefield',
              test: id => hasAny(id, [
                '/src/engine/v080-battlefield',
                '/src/engine/v080-narrative-combat-orchestration',
                '/src/engine/v090-beast-enemy-registry',
              ]),
              priority: 29,
            },
            {
              name: 'engine-action',
              test: id => hasAny(id, [
                '/src/engine/v090-world-action-protocol',
                '/src/engine/v090-training-ground-clue-engine',
                '/src/engine/field-action',
                '/src/engine/training-ground-engine',
              ]),
              priority: 28,
            },
            {
              name: 'engine-economy',
              test: id => hasAny(id, [
                '/src/engine/auction',
                '/src/engine/economy',
                '/src/engine/feeding-rules',
                '/src/engine/gu-use-registry',
                '/src/engine/material-registry',
                '/src/engine/recipe-discovery',
                '/src/engine/refine-engine',
                '/src/engine/shop-engine',
              ]),
              priority: 27,
            },
            {
              name: 'engine-story',
              test: id => hasAny(id, [
                '/src/engine/chapter-router',
                '/src/engine/context-builder',
                '/src/engine/dao-reputation-policy',
                '/src/engine/encounter-injector',
                '/src/engine/HeavenlyLandEngine',
                '/src/engine/npc-cross-domain',
                '/src/engine/response-pipeline',
                '/src/engine/state-update-applier',
                '/src/engine/v080-calamity',
                '/src/engine/v080-cultivation',
                '/src/engine/v080-ending',
                '/src/engine/v080-inheritance',
                '/src/engine/v080-midgame',
                '/src/engine/v080-narrative',
                '/src/engine/v080-origin',
              ]),
              priority: 26,
            },
            { name: 'engine', test: id => normalizedId(id).includes('/src/engine/'), priority: 10 },
          ],
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
