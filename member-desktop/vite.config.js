import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import prismjsPlugin from "vite-plugin-prismjs";

// https://vitejs.dev/config/
//引用path
const path = require("path");
//引用fs
const fs = require("fs");
export default defineConfig({
    plugins: [
        vue(),
        prismjsPlugin({
            "languages": ["javascript", "css", "markup","markdown","csharp","java","html","go"],
            "plugins": ["line-numbers","match-braces"],
            "theme": "okaidia",
            "css": true
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        open: true,
        https: {
            // 配置证书
            cert: fs.readFileSync(path.join(__dirname, "cert/localhost.crt")),
            // 配置证书密钥
            key: fs.readFileSync(path.join(__dirname, "cert/localhost.key")),
        },

    },
})
