import packageRoot from 'app-root-path'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { defineConfig, UserConfig } from 'vite'
import manifestJson from './manifest.json'

export default defineConfig(async ({ command }) => {
  dotenv.config({
    path: packageRoot.path + '/.env.local'
  })

  const isDev = process.env.APP_ENV === 'development'

  const base = `https://${process.env['STATIC_BUILD_HOST'] ?? 'localhost:3000'}/`

  const define = { __IR_ENGINE_VERSION__: JSON.stringify(manifestJson.engineVersion) }
  for (const [key, value] of Object.entries(process.env)) {
    define[`globalThis.process.env.${key}`] = JSON.stringify(value)
  }

  const returned = {
    define: define,
    server: {
      cors: isDev ? false : true,
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
      ...(isDev
        ? {
            https: {
              key: fs.readFileSync(path.join(packageRoot.path, 'certs/key.pem')),
              cert: fs.readFileSync(path.join(packageRoot.path, 'certs/cert.pem'))
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
    plugins: [],
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
