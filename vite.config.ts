import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        allowedHosts: [
            'money-first.ru',
            'www.money-first.ru',
        ]
    },
    publicDir: 'public',
})