import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Mushroom Kingdom Mashup Maker - Vite Production Config
 * Optimized for PWA, games, TailwindCSS, and TypeScript
 */
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // 🔧 Base Config
    base: './',
    server: {
      port: 3000,
      host: true,
      open: true,
      hmr: {
        overlay: true,
        host: 'localhost'
      },
      watch: {
        usePolling: process.env.CI !== undefined
      }
    },

    // 🎮 Game Optimizations
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            game: ['three'],
            ai: ['@google/generative-ai']
          }
        }
      },
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000
    },

    // 📱 PWA Production Settings
    preview: {
      port: 8080,
      host: true
    },

    // 🔌 Plugins
    plugins: [
      react({
        babel: {
          plugins: [
            ['@babel/plugin-transform-runtime']
          ]
        }
      })
    ],

    // 🌈 TailwindCSS + PostCSS
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer')
        ]
      }
    },

    // 🛡️ Security Headers (Development)
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    },

    // 📍 Path Resolution (Fixed)
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/constants': path.resolve(__dirname, 'src/constants')
      }
    },

    // 🔑 Environment Variables (Production Safe)
    define: {
      __APP_VERSION__: JSON.stringify('1.0.3'),
      __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },

    // 🎯 TypeScript Optimization
    esbuild: {
      target: 'es2022'
    },

    // 📊 Performance Optimization
    optimizeDeps: {
      include: ['react', 'react-dom', '@google/generative-ai']
    },

    // 🧹 Clear Screen on Rebuild
    clearScreen: false,

    // 🚀 Game Canvas Worker Support
    worker: {
      format: 'es'
    }
  };
});
