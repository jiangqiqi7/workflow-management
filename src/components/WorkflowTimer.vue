<template>
  <div class="workflow-timer">
    <div class="timer-label">
      <el-icon><Timer /></el-icon>
      <span>{{ stepName }}</span>
    </div>
    <div class="timer-display">
      <span class="time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Timer } from '@element-plus/icons-vue'

const props = defineProps({
  startTime: {
    type: String,
    required: true
  },
  stepName: {
    type: String,
    default: '当前步骤'
  }
})

const elapsedSeconds = ref(0)
let timerInterval = null

// 计算已经过去的时间（秒）
const calculateElapsedTime = () => {
  const start = new Date(props.startTime)
  const now = new Date()
  return Math.floor((now - start) / 1000)
}

// 格式化时间显示 (HH:MM:SS)
const formattedTime = computed(() => {
  const hours = Math.floor(elapsedSeconds.value / 3600)
  const minutes = Math.floor((elapsedSeconds.value % 3600) / 60)
  const seconds = elapsedSeconds.value % 60
  
  return [hours, minutes, seconds]
    .map(num => String(num).padStart(2, '0'))
    .join(':')
})

// 启动计时器
const startTimer = () => {
  // 清除之前的计时器
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  
  elapsedSeconds.value = calculateElapsedTime()
  
  timerInterval = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

// 监听 startTime 变化，重新启动计时器
watch(() => props.startTime, () => {
  startTimer()
})

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.workflow-timer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(135deg, #aedccc 0%, #8cbcad 100%);
  border-radius: 0.5rem;
  margin-top: 1rem;
  color: #000;
}

.timer-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.timer-label .el-icon {
  font-size: 1.25rem;
}

.timer-display {
  display: flex;
  align-items: center;
}

.time {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
  color: #000;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.timer-display {
  animation: pulse 2s ease-in-out infinite;
}
</style>
