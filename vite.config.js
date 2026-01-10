import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://116.204.65.72:8881',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            },
            '/task': {
                target: 'http://36.103.203.206:8000',
                changeOrigin: true
            }
        }
    }
})