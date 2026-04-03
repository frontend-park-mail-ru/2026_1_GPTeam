import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

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
    publicDir: 'public',
})