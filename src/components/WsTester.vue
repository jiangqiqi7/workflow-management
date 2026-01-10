<template>
  <div class="ws-tester">
    <h3>WebSocket 联调测试</h3>

    <div class="config">
      <label>
        后端地址（http/https/ws/wss 均可）：
        <input v-model="backendBaseInput" placeholder="http://localhost:8000" />
      </label>
      <div class="hint">当前 client_id：<code>{{ clientId }}</code></div>
    </div>

    <div class="cards">
      <!-- 1. 实时视频流结果推送 -->
      <div class="card">
        <div class="card-header">
          <strong>1) 实时视频流结果推送</strong>
          <button @click="toggleVideoWs" :disabled="videoConnecting">
            {{ videoConnected ? '断开' : (videoConnecting ? '连接中...' : '连接') }}
          </button>
        </div>
        <div class="status">{{ videoStatus }}</div>
        <div class="preview">
          <img v-if="videoFrame" :src="videoFrame" alt="视频帧" class="frame" />
          <div v-else class="placeholder">暂无帧</div>
        </div>
      </div>

      <!-- 2. 视频帧上传流 -->
      <div class="card">
        <div class="card-header">
          <strong>2) 视频帧上传流</strong>
          <div class="controls">
            <label>发送帧率：
              <input type="number" min="1" max="30" v-model.number="fps" /> FPS
            </label>
            <label>
              源：
              <select v-model="captureSource">
                <option value="camera">摄像头</option>
                <option value="file">本地文件</option>
              </select>
            </label>
            <input v-if="captureSource==='file'" type="file" accept="image/*" @change="onFileChange" />
            <button @click="toggleUpload" :disabled="uploadConnecting">
              {{ uploadRunning ? '停止' : (uploadConnecting ? '连接中...' : '开始上传') }}
            </button>
          </div>
        </div>
        <div class="status">{{ uploadStatus }}</div>
        <div class="preview row">
          <video v-if="captureSource==='camera'" ref="cameraEl" autoplay playsinline muted class="camera"></video>
          <img v-if="lastSentFrame" :src="lastSentFrame" class="frame small" alt="最近发送" />
        </div>
      </div>

      <!-- 3. 任务状态实时更新 -->
      <div class="card">
        <div class="card-header">
          <strong>3) 任务状态实时更新</strong>
          <button @click="toggleStatusWs" :disabled="statusConnecting">
            {{ statusConnected ? '断开' : (statusConnecting ? '连接中...' : '连接') }}
          </button>
        </div>
        <div class="status">{{ statusText }}</div>
        <pre class="log" v-if="statusMessages.length">{{ prettyStatus }}</pre>
        <div class="placeholder" v-else>暂无状态消息</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

// backend base from env, user can override in input box
const defaultBackendBase = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000'
const backendBaseInput = ref(defaultBackendBase)

// ---- client_id ----
const getClientId = () => {
  try {
    const key = 'client_id'
    let v = sessionStorage.getItem(key)
    if (!v) {
      v = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
      sessionStorage.setItem(key, v)
    }
    return v
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}
const clientId = ref(getClientId())

// ---- url builders ----
const toWsScheme = (base) => {
  if (base.startsWith('https://')) return 'wss://' + base.slice(8)
  if (base.startsWith('http://')) return 'ws://' + base.slice(7)
  return base
}

const videoUrl = computed(() => {
  const base = toWsScheme(backendBaseInput.value)
  const trail = base.endsWith('/') ? base.slice(0, -1) : base
  return `${trail}/ai/video?client_id=${encodeURIComponent(clientId.value)}`
})

const uploadUrl = computed(() => {
  const base = toWsScheme(backendBaseInput.value)
  const trail = base.endsWith('/') ? base.slice(0, -1) : base
  return `${trail}/inspection/upload_stream?client_id=${encodeURIComponent(clientId.value)}`
})

const statusUrl = computed(() => {
  const base = toWsScheme(backendBaseInput.value)
  const trail = base.endsWith('/') ? base.slice(0, -1) : base
  return `${trail}/task/status/${encodeURIComponent(clientId.value)}`
})

// ---- 1) 视频流下行 ----
let wsVideo = null
const videoFrame = ref('')
const videoStatus = ref('未连接')
const videoConnected = ref(false)
const videoConnecting = ref(false)

const connectVideo = () => {
  if (wsVideo && (wsVideo.readyState === WebSocket.OPEN || wsVideo.readyState === WebSocket.CONNECTING)) return
  videoConnecting.value = true
  videoStatus.value = '连接中...'
  wsVideo = new WebSocket(videoUrl.value)
  wsVideo.onopen = () => {
    videoConnecting.value = false
    videoConnected.value = true
    videoStatus.value = '已连接'
  }
  wsVideo.onmessage = (ev) => {
    const data = ev.data
    if (typeof data === 'string') {
      videoFrame.value = data.startsWith('data:image/jpeg;base64,') ? data : `data:image/jpeg;base64,${data}`
    }
  }
  wsVideo.onerror = () => {
    videoStatus.value = '连接错误'
    videoConnecting.value = false
    videoConnected.value = false
  }
  wsVideo.onclose = () => {
    videoStatus.value = '已断开'
    videoConnecting.value = false
    videoConnected.value = false
  }
}
const disconnectVideo = () => { if (wsVideo) { wsVideo.close(); wsVideo = null } }
const toggleVideoWs = () => { videoConnected.value ? disconnectVideo() : connectVideo() }

// ---- 2) 上传流 ----
let wsUpload = null
let timer = null
const uploadStatus = ref('未连接')
const uploadRunning = ref(false)
const uploadConnecting = ref(false)
const fps = ref(5)
const captureSource = ref('camera') // 'camera' | 'file'
const cameraEl = ref(null)
const lastSentFrame = ref('')
let fileImage = null

const startCamera = async () => {
  if (!cameraEl.value) return
  if (cameraEl.value.srcObject) return
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  cameraEl.value.srcObject = stream
}
const stopCamera = () => {
  if (cameraEl.value?.srcObject) {
    cameraEl.value.srcObject.getTracks().forEach(t => t.stop())
    cameraEl.value.srcObject = null
  }
}

const onFileChange = (e) => {
  const f = e.target.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => { fileImage = reader.result }
  reader.readAsDataURL(f)
}

const grabFrameBase64 = async () => {
  if (captureSource.value === 'camera') {
    if (!cameraEl.value) return ''
    const video = cameraEl.value
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    return dataUrl.split(',')[1] // raw base64
  }
  if (captureSource.value === 'file' && fileImage) {
    return String(fileImage).split(',')[1] || ''
  }
  return ''
}

const connectUpload = () => {
  if (wsUpload && (wsUpload.readyState === WebSocket.OPEN || wsUpload.readyState === WebSocket.CONNECTING)) return
  uploadConnecting.value = true
  uploadStatus.value = '连接中...'
  wsUpload = new WebSocket(uploadUrl.value)
  wsUpload.onopen = async () => {
    uploadConnecting.value = false
    uploadRunning.value = true
    uploadStatus.value = '已连接，开始发送帧'
    if (captureSource.value === 'camera') await startCamera()
    const interval = Math.max(1, Math.min(30, fps.value))
    const period = 1000 / interval
    timer = setInterval(async () => {
      const base64 = await grabFrameBase64()
      if (base64) {
        try {
          wsUpload.send(base64)
          lastSentFrame.value = `data:image/jpeg;base64,${base64}`
        } catch (e) {
          // ignore single send errors
        }
      }
    }, period)
  }
  wsUpload.onmessage = (ev) => {
    // expect 'success' or 'error: ...'
    uploadStatus.value = `响应: ${ev.data}`
  }
  wsUpload.onerror = () => {
    uploadStatus.value = '连接错误'
    uploadConnecting.value = false
    uploadRunning.value = false
    clearInterval(timer); timer = null
    stopCamera()
  }
  wsUpload.onclose = () => {
    uploadStatus.value = '已断开'
    uploadConnecting.value = false
    uploadRunning.value = false
    clearInterval(timer); timer = null
    stopCamera()
  }
}
const disconnectUpload = () => {
  if (wsUpload) { wsUpload.close(); wsUpload = null }
  clearInterval(timer); timer = null
  uploadRunning.value = false
  stopCamera()
}
const toggleUpload = () => { uploadRunning.value ? disconnectUpload() : connectUpload() }

// ---- 3) 任务状态 ----
let wsStatus = null
const statusMessages = ref([])
const statusText = ref('未连接')
const statusConnected = ref(false)
const statusConnecting = ref(false)
const prettyStatus = computed(() => JSON.stringify(statusMessages.value, null, 2))

const connectStatus = () => {
  if (wsStatus && (wsStatus.readyState === WebSocket.OPEN || wsStatus.readyState === WebSocket.CONNECTING)) return
  statusConnecting.value = true
  statusText.value = '连接中...'
  wsStatus = new WebSocket(statusUrl.value)
  wsStatus.onopen = () => { statusConnecting.value = false; statusConnected.value = true; statusText.value = '已连接' }
  wsStatus.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data)
      statusMessages.value.unshift(data)
      if (statusMessages.value.length > 100) statusMessages.value.pop()
    } catch {
      // ignore non-JSON
    }
  }
  wsStatus.onerror = () => { statusText.value = '连接错误'; statusConnecting.value = false; statusConnected.value = false }
  wsStatus.onclose = () => { statusText.value = '已断开'; statusConnecting.value = false; statusConnected.value = false }
}
const disconnectStatus = () => { if (wsStatus) { wsStatus.close(); wsStatus = null } }
const toggleStatusWs = () => { statusConnected.value ? disconnectStatus() : connectStatus() }

onBeforeUnmount(() => {
  disconnectVideo()
  disconnectUpload()
  disconnectStatus()
})
</script>

<style scoped>
.ws-tester { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px }
.config { display: flex; flex-direction: column; gap: 6px; margin: 8px 0 12px }
.config input { width: 100%; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px }
.hint { color: #6b7280; font-size: 12px }
.cards { display: grid; grid-template-columns: 1fr; gap: 12px }
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: #fafafa }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px }
.card-header .controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap }
.card-header button { padding: 6px 10px; border-radius: 6px; border: 1px solid #d1d5db; background: #fff; cursor: pointer }
.status { color: #6b7280; font-size: 12px; margin: 6px 0 }
.preview { display: flex; align-items: center; justify-content: center; background: #000; border-radius: 6px; min-height: 160px; overflow: hidden }
.preview.row { gap: 10px; justify-content: flex-start; background: transparent; min-height: unset }
.placeholder { color: #9ca3af; text-align: center; padding: 16px }
.frame { max-width: 100%; width: 240px; aspect-ratio: 3/4; object-fit: cover }
.frame.small { width: 120px }
.camera { width: 240px; aspect-ratio: 3/4; background: #000; object-fit: cover; border-radius: 6px }
.log { background: #0b1020; color: #d1fae5; padding: 10px; border-radius: 6px; max-height: 220px; overflow: auto; font-size: 12px }
@media (min-width: 900px) { .cards { grid-template-columns: repeat(2, 1fr) } }
</style>