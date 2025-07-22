import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import packageRoot from 'app-root-path'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { defineConfig, UserConfig } from 'vite'
import viteCompression from 'vite-plugin-compression2'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import svgr from 'vite-plugin-svgr'
import manifestJson from './manifest.json'

export default defineConfig(async () => {
  dotenv.config({
    path: packageRoot.path + '/.env.local'
  })

  const isDevOrLocal = process.env.APP_ENV === 'development' || process.env.VITE_LOCAL_BUILD === 'true'

  const base = `https://${process.env['STATIC_BUILD_HOST'] ?? 'localhost:3000'}/`

  const define = { __IR_ENGINE_VERSION__: JSON.stringify(manifestJson.engineVersion) }
  for (const [key, value] of Object.entries(process.env)) {
    define[`globalThis.process.env.${key}`] = JSON.stringify(value)
  }

  const returned = {
    define: define,
    server: {
      cors: !isDevOrLocal,
      hmr:
        process.env.VITE_HMR === 'true'
          ? {
              port: process.env['VITE_APP_PORT'],
              host: process.env['VITE_APP_HOST'],
              overlay: false
            }
          : false,
      host: process.env['VITE_APP_HOST'],
      port: process.env['VITE_APP_PORT'],
      headers: {
        'Origin-Agent-Cluster': '?1'
      },
      ...(isDevOrLocal
        ? {
            https: {
              key: fs.readFileSync(path.join(packageRoot.path, process.env.KEY || 'certs/key.pem')),
              cert: fs.readFileSync(path.join(packageRoot.path, process.env.CERT || 'certs/cert.pem'))
            }
          }
        : {})
    },
    base,
    optimizeDeps: {
      entries: ['./src/main.tsx'],
      exclude: [],
      esbuildOptions: {
        target: 'es2020'
      }
    },
    plugins: [
      svgr(),
      nodePolyfills(),
      viteCompression({
        include: /\.(js|mjs|json|css)$/i,
        algorithm: 'brotliCompress',
        deleteOriginalAssets: true
      }),
      viteCommonjs({
        include: ['use-sync-external-store']
      })
    ],
    build: {
      target: 'esnext',
      sourcemap: process.env.VITE_SOURCEMAPS === 'true' ? true : false,
      minify: 'esbuild',
      dynamicImportVarsOptions: {
        warnOnError: true
      },
      rollupOptions: {
        external: ['dotenv-flow'],
        output: {
          dir: 'dist',
          format: 'es', // 'commonjs' | 'esm' | 'module' | 'systemjs'
          // ignore files under 1mb
          experimentalMinChunkSize: 1000000
        }
      }
    }
  } as UserConfig

  return returned
})
