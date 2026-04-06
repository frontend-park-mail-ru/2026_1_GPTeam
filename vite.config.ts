import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scssVariablesPath = path.resolve(__dirname, 'src/_variables.scss').replace(/\\/g, '/')

export default defineConfig({
    plugins: [
        VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "service_worker.ts",
            injectManifest: {
                swDest: "dist/service_worker.js"
            },
            devOptions: {
                type: "module",
            }
        })
    ],
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        hmr: {
            host: 'localhost',
            protocol: 'ws'
        },
        allowedHosts: [
            'money-first.ru',
            'www.money-first.ru',
            'localhost'
        ]
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "${scssVariablesPath}" as *;\n`
            }
        }
    },
    publicDir: 'public',
})
