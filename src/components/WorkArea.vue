<template>
  <div class="work-area">
    <div class="content">
        <div class="video-panel-full">
          <!-- Show WebSocket stream if connected and has frame -->
          <template v-if="currentFrame">
            <img
              class="video-player-full"
              :src="currentFrame"
              alt="实时视频流"
            />
          </template>

          <!-- Show fallback video if provided and no WebSocket stream -->
          <template v-else-if="videoSources && videoSources[0]">
            <video
              class="video-player-full"
              :src="videoSources[0]"
              controls
              autoplay
              muted
              playsinline
            ></video>
          </template>

          <!-- Show empty state with connection status -->
          <template v-else>
            <div class="video-empty-full">
              <svg class="camera-icon" viewBox=                      "0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="empty-text">
                {{ connectionStatus }}
              </div>
              <button 
                class="retry-btn" 
                @click="reconnectWebSocket"
                :disabled="isConnecting"
              >
                {{ isConnecting ? '连接中...' : '重新连接' }}
              </button>
            </div>
          </template>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps({
  activeStep: {
    type: String,
    required: true
  },
  // optional array of video URLs; if empty, panels show placeholders
  videoSources: {
    type: Array,
    default: () => []
  },
  // how many panels to show when sources are empty
  panels: {
    type: Number,
    default: 1
  },
  // WebSocket URL (can be overridden via prop)
  wsUrl: {
    type: String,
    default: 'ws://36.103.203.206:8000/ai/video'
  }
})

const emit = defineEmits(['retry'])

// WebSocket state
let ws = null
const currentFrame = ref(null)
const isConnecting = ref(false)
const connectionStatus = ref('正在连接视频流...')
const clientIdData = ref(null)

// 获取当前摄像头 client_id
const fetchClientId = async () => {
  // 测试模式：写死 client_id
  return 'test'
  
  /* 正式模式：从后端获取 client_id
  try {
    // 开发环境使用代理，生产环境直接请求
    const backendBase = import.meta.env.VITE_BACKEND_BASE_URL || 'http://116.204.65.72:8881'
    const apiUrl = import.meta.env.DEV 
      ? '/api/gdmp/v1/api/nt/get_current_client_id'
      : `${backendBase}/gdmp/v1/api/nt/get_current_client_id`
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.code === 200 && data.client_id) {
      clientIdData.value = data
      console.log('获取到摄像头 client_id:', data.client_id)
      return data.client_id
    } else {
      console.log('当前没有正在进行的清洗任务')
      connectionStatus.value = '当前没有正在进行的清洗任务'
      return null
    }
  } catch (error) {
    console.error('获取 client_id 失败:', error)
    connectionStatus.value = '无法获取摄像头信息'
    return null
  }
  */
}

// Build final WS url with client_id param
const buildWsUrl = async () => {
  const base = props.wsUrl
  const cid = await fetchClientId()
  
  if (!cid) {
    return null // 没有 client_id，不建立连接
  }
  
  // Allow http(s) input and convert to ws(s)
  let url = base
  if (url.startsWith('http://')) url = 'ws://' + url.slice(7)
  if (url.startsWith('https://')) url = 'wss://' + url.slice(8)
  const hasQuery = url.includes('?')
  const hasClientParam = /[?&]client_id=/.test(url)
  if (!hasClientParam) {
    url += (hasQuery ? '&' : '?') + `client_id=${encodeURIComponent(cid)}`
  }
  return url
}

// Connect to WebSocket and handle incoming frames
const connectWebSocket = async () => {
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return // already connecting or connected
  }

  isConnecting.value = true
  connectionStatus.value = '正在获取摄像头信息...'

  try {
    const finalUrl = await buildWsUrl()
    
    if (!finalUrl) {
      isConnecting.value = false
      return // 没有 client_id，不建立连接
    }
    
    ws = new WebSocket(finalUrl)

    ws.onopen = () => {
      console.log('WebSocket 已连接:', finalUrl)
      isConnecting.value = false
      connectionStatus.value = '视频流已连接'
    }

    ws.onmessage = (event) => {
      // Expecting Base64 encoded JPEG data
      const data = event.data
      
      // Check if it's already a data URL or raw base64
      if (typeof data === 'string') {
        if (data.startsWith('data:image/jpeg;base64,')) {
          currentFrame.value = data
        } else {
          // Assume it's raw base64, add the data URL prefix
          currentFrame.value = `data:image/jpeg;base64,${data}`
        }
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      isConnecting.value = false
      connectionStatus.value = '视频流连接失败'
    }

    ws.onclose = () => {
      console.log('WebSocket 已断开')
      isConnecting.value = false
      connectionStatus.value = '视频流已断开'
      currentFrame.value = null
      
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.CLOSED) {
          console.log('尝试自动重连...')
          connectWebSocket()
        }
      }, 3000)
    }
  } catch (error) {
    console.error('WebSocket 连接失败:', error)
    isConnecting.value = false
    connectionStatus.value = '无法连接到视频流'
  }
}

// Reconnect handler
const reconnectWebSocket = async () => {
  if (ws) {
    ws.close()
    ws = null
  }
  currentFrame.value = null
  clientIdData.value = null
  
  // 重新获取 client_id 并连接
  await connectWebSocket()
}

// Lifecycle hooks
onMounted(() => {
  connectWebSocket()
})

onBeforeUnmount(() => {
  if (ws) {
    ws.close()
    ws = null
  }
})

// show a single monitoring panel (first source) per user request
const panelsCount = computed(() => 1)
</script>

<style scoped>
.work-area {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.5rem; /* reduce padding so video can fill more */
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  color: #374151;
  margin-bottom: 1rem;
}

.content {
  /* allow the content area to stretch and let video-panel-full fill it */
  margin-top: 0;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0; /* allow children to shrink properly inside flex */
}

.current-step {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.step-highlight {
  font-weight: bold;
  color: #3b82f6;
  font-size: 1rem;
}

.work-content {
  margin-top: 2rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 0.25rem;
}

.placeholder {
  text-align: center;
  color: #9ca3af;
}

/* video area styles */
.video-area .hint {
  font-size: 0.95rem;
  color: #374151;
  margin-bottom: 12px;
  font-weight: 600;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.video-panel {
  background: #fff;
  border: 1px dashed rgba(15,23,42,0.06);
  border-radius: 8px;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.camera-icon { 
  width: 64px;
  height: 64px;
  color: #94a3b8;
}
.empty-text { font-size: 0.95rem }
.retry-btn { 
  background: #eef2ff; 
  border: none; 
  color: #2563eb; 
  padding: 6px 10px; 
  border-radius: 6px; 
  cursor: pointer;
  transition: all 0.2s;
}
.retry-btn:hover:not(:disabled) {
  background: #dbeafe;
}
.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .video-grid { grid-template-columns: 1fr }
}

/* full video styles */
.video-panel-full {
  width: 100%;
  flex: 1 1 auto; /* fill the remaining vertical space */
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  /* increase min height so the video can be taller (slightly smaller now) */
  min-height: 480px;
}

.video-player-full {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

@media (max-width: 700px) {
  .video-panel-full { min-height: 380px }
}

.video-empty-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #cbd5e1;
}

.video-empty-full .camera-icon { 
  width: 80px;
  height: 80px;
  color: #64748b;
}
.video-empty-full .empty-text { 
  font-size: 1.1rem;
  color: #94a3b8;
}

.video-panel-full .retry-btn { background: rgba(255,255,255,0.08); color: #fff; border-radius: 6px; padding: 8px 12px }
</style>