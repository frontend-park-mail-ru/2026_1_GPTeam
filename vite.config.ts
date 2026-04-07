import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import fs from "fs";
import dotenv from "dotenv";
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const scssVariablesPath = path.resolve(__dirname, "src/_variables.scss").replace(/\\/g, "/")

dotenv.config()
let DEBUG: boolean = process.env.DEBUG === "true";
let port: number = Number(process.env.PORT)

let server: any = {
    host: true,
    port: port,
    strictPort: true,
    hmr: {
        host: "localhost",
        protocol: "ws"
    },
    allowedHosts: [
        "money-first.ru",
        "www.money-first.ru",
        "localhost",
    ]
};

if (!DEBUG) {
    let cerf_file: string | undefined = process.env.CERT_FILE;
    if (!cerf_file) {
        throw new Error("CERT_FILE not set");
    }
    let key_file: string | undefined = process.env.KEY_FILE;
    if (!key_file) {
        throw new Error("KEY_FILE not set");
    }
    server.https = {
        key: fs.readFileSync(path.resolve(__dirname, key_file)),
        cert: fs.readFileSync(path.resolve(__dirname, cerf_file)),
    };
}

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
    server: server,
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `@use "${scssVariablesPath}" as *;\n`
            }
        }
    },
    publicDir: "public",
})
