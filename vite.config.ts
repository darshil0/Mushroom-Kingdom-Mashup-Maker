import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Mushroom Kingdom Mashup Maker - Vite Production Config
 * Optimized for PWA, games, TailwindCSS, and TypeScript
 */
export default defineConfig(({ command, mode }) => {
  // Load all environment variables starting with VITE_ or process.env (like CI)
  // FIX 1: Use 'VITE_' prefix for public env vars, and load all for internal use
  const env = loadEnv(mode, process.cwd(), '');
  
  // FIX 2: Consolidate duplicate 'server' configuration blocks
  const serverConfig = {
    port: 3000,
    host: true,
    open: true,
    hmr: {
      overlay: true,
      host: 'localhost'
    },
    watch: {
      usePolling: env.CI !== undefined
    },
    // FIX 2: Move security headers into the main server block
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  };

  return {
    // 🔧 Base Config
    base: './',

    // FIX 2: Use consolidated server config
    server: serverConfig,

    // 📱 PWA Production Settings (preview config is correct)
    preview: {
      port: 8080,
      host: true
    },

    // 🔌 Plugins
    plugins: [
      react({
        // FIX 3: Removed unnecessary Babel configuration as Vite's default setup is highly optimized
        // and @babel/plugin-transform-runtime is usually included via @vitejs/plugin-react's dependencies.
      })
    ],

    // 🎮 Game Optimizations
    build: {
      // FIX 4: Use ternary operator for sourcemap setting
      sourcemap: mode === 'development',
      // FIX 5: Set target to 'es2020' for wider compatibility with older browsers, while maintaining modern features
      target: 'es2020', 
      rollupOptions: {
        output: {
          // FIX 6: Add 'react-helmet-async' to vendor chunk
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-helmet-async'],
            game: ['three'],
            ai: ['@google/generative-ai']
          },
          // FIX 7: Enable hash for better cache busting
          entryFileNames: `assets/[name]-[hash].js`, 
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`
        }
      },
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000
    },

    // 🌈 TailwindCSS + PostCSS
    css: {
      postcss: {
        // FIX 8: Use string require to avoid TypeScript errors and ensure compatibility
        plugins: [
          require('tailwindcss'),
          require('autoprefixer')
        ]
      }
    },

    // 📍 Path Resolution (Fixed)
    resolve: {
      alias: {
        // FIX 9: Simplified path aliases to just the root, consistent with tsconfig.json fix
        '@': path.resolve(__dirname, 'src')
        // Removed: '@/components', '@/utils', '@/types', etc.
      }
    },

    // 🔑 Environment Variables (Production Safe)
    define: {
      // FIX 10: Update version to match 1.0.4 and use a more standard format for build date
      __APP_VERSION__: JSON.stringify('1.0.4'),
      __APP_BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '')),
      
      // FIX 11: Pass the key via a public VITE_ prefix for security and best practice
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
      
      // FIX 12: Use import.meta.env.* for consistency instead of polluting the global process.env
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.DEV': JSON.stringify(mode === 'development'),
      'import.meta.env.PROD': JSON.stringify(mode === 'production')
    },

    // 🎯 TypeScript Optimization (esbuild target should align with build.target)
    esbuild: {
      target: 'es2020' // FIX 5: Aligned with build.target
    },

    // 📊 Performance Optimization
    optimizeDeps: {
      // FIX 13: Added 'react-helmet-async' to optimizeDeps
      include: ['react', 'react-dom', 'react-helmet-async', '@google/generative-ai']
    },

    // 🧹 Clear Screen on Rebuild (Correct)
    clearScreen: false,

    // 🚀 Game Canvas Worker Support (Correct)
    worker: {
      format: 'es'
    }
  };
});
