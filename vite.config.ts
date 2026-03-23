import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'public',
            filename: 'service_worker.js',
            registerType: 'autoUpdate',
            injectManifest: {
                swDest: 'dist/service_worker.js' 
            },
            devOptions: {
                enabled: true,
                type: 'module'
            }
        })
    ],
    server: {
        allowedHosts: [
            'money-first.ru',
            'www.money-first.ru',
        ]
    },
    publicDir: 'public',
})