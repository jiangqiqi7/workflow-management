<template>
  <!-- 显示告警信息 -->
  <div class="review-notice alarm-notice" v-if="alarmData && alarmData.total > 0">
    <div class="notice-title">
      提示信息
      <span class="alarm-count">({{ alarmData.total }}条告警)</span>
    </div>
    <div class="alarm-list">
      <div v-for="(alarm, index) in alarmData.alarms" :key="index" class="alarm-item">
        <div class="alarm-time">{{ formatTime(alarm.timestamp) }}</div>
        <div class="alarm-content">{{ alarm.message || alarm.description || '告警信息' }}</div>
      </div>
    </div>
  </div>
  
  <!-- 无告警时的提示 -->
  <div class="review-notice no-alarm" v-else>
    <div class="notice-title">提示信息</div>
    <div class="notice-content no-alarm-text">最近没有告警提醒</div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { parseBusinessScriptContent, unwrapBusinessScriptResponse } from '../utils/helpers.js'

const alarmData = ref(null)
const previousAlarmCount = ref(0)
const taskId = ref(null)
let alarmPollingTimer = null

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 测试用例 - 取消注释来测试不同的警告场景
// const testInfo = ref('检测到异常操作，请立即处理')
// const testInfo = ref('系统温度过高，需要检查设备')
// const testInfo = ref('最近没有告警提醒')  // 这个不会触发警告音和语音
// 使用测试数据: 在模板中将 info 改为 testInfo

// 获取 task_id
const fetchTaskId = async () => {
  try {
    // 开发环境使用代理，生产环境直接请求
    const backendBase = import.meta.env.VITE_BACKEND_BASE_URL || 'http://116.204.65.72:8881'
    const apiUrl = import.meta.env.DEV 
      ? '/cms/v1/module/business_script/runScriptByCode?code=get_current_client_id'
      : `${backendBase}/cms/v1/module/business_script/runScriptByCode?code=get_current_client_id`
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    const payload = unwrapBusinessScriptResponse(data)
    
    let tid = null
    if (payload && typeof payload === 'object') {
      // 优先在解析后的对象中查找 task_id/client_id
      tid = payload.task_id || payload.client_id || payload.id || null
    }

    if (tid) {
      taskId.value = tid
      console.log('获取到 task_id:', tid)
      return tid
    }

    console.log('当前没有正在进行的清洗任务')
    return null
  } catch (error) {
    console.error('获取 task_id 失败:', error)
    return null
  }
}

// 获取最新告警（从 get_latest_alarm 接口）
const fetchLatestAlarm = async () => {
  if (!taskId.value) return null
  
  try {
    const backendBase = import.meta.env.VITE_BACKEND_BASE_URL || 'http://116.204.65.72:8881'
    const alarmApiUrl = `${backendBase}/cms/v1/module/business_script/runScriptByCode?code=get_latest_alarm`
    
    const response = await fetch(alarmApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId.value
      })
    })
    const data = await response.json()
    
    // 支持 content 为字符串的情况：统一反解
    let alarmPayload = null
    const payload = unwrapBusinessScriptResponse(data)
    if (payload.code === 0 && payload.data) {
      alarmPayload = payload.data
    } else if (payload && typeof payload === 'object' && !payload.code) {
      alarmPayload = payload
    }

    if (alarmPayload) {
      return {
        source: 'latest_alarm',
        ...alarmPayload
      }
    }
  } catch (err) {
    console.error(`获取任务 ${taskId.value} 的最新告警失败:`, err)
  }
  return null
}

// 获取告警列表（从 ReviewNotice 接口）
const fetchReviewNoticeAlarms = async () => {
  if (!taskId.value) return null
  
  try {
    const url = import.meta.env.DEV
      ? `/task/${taskId.value}/alarms`
      : `http://36.103.203.206:8000/task/${taskId.value}/alarms`
    
    const response = await fetch(url)
    const data = await response.json()
    
    // 返回格式: { task_id, total, alarms: [] }
    if (data.task_id !== undefined && data.total > 0 && data.alarms && data.alarms.length > 0) {
      return {
        source: 'review_notice',
        task_id: data.task_id,
        total: data.total,
        alarms: data.alarms
      }
    }
  } catch (err) {
    console.error(`获取任务 ${taskId.value} 的 ReviewNotice 告警失败:`, err)
  }
  return null
}

// 获取告警信息（合并两个接口的数据）
const fetchAlarmData = async () => {
  if (!taskId.value) {
    return
  }
  
  try {
    // 同时从两个接口获取告警
    const [latestAlarm, reviewNoticeAlarm] = await Promise.all([
      fetchLatestAlarm(),
      fetchReviewNoticeAlarms()
    ])
    
    let mergedData = null
    const oldCount = previousAlarmCount.value
    
    // 优先使用 latest_alarm 接口的数据
    if (latestAlarm) {
      // 将 latest_alarm 数据转换为 ReviewNotice 格式
      mergedData = {
        task_id: taskId.value,
        total: 1,
        alarms: [{
          timestamp: latestAlarm.timestamp || Date.now(),
          message: latestAlarm.message || '检测到异常',
          description: latestAlarm.message || '检测到异常'
        }]
      }
    } else if (reviewNoticeAlarm) {
      // 使用 ReviewNotice 接口的数据
      mergedData = reviewNoticeAlarm
    }
    
    if (mergedData) {
      const newCount = mergedData.total || 0
      
      alarmData.value = mergedData
      previousAlarmCount.value = newCount
      
      console.log('合并后的告警信息:', mergedData)
      
      // 如果有新的告警（数量增加），触发语音播报
      if (newCount > oldCount && mergedData.alarms && mergedData.alarms.length > 0) {
        // 播报最新的告警
        const latestAlarm = mergedData.alarms[0]
        const message = latestAlarm.message || latestAlarm.description || '检测到新告警'
        speakWarning(message)
      }
    } else {
      // 没有告警数据
      alarmData.value = null
      previousAlarmCount.value = 0
    }
  } catch (error) {
    console.error('获取告警信息失败:', error)
  }
}

// 开始轮询告警信息
const startAlarmPolling = async () => {
  if (alarmPollingTimer) {
    clearInterval(alarmPollingTimer)
  }
  
  // 先获取 task_id
  await fetchTaskId()
  
  if (!taskId.value) {
    console.log('无法获取 task_id，不启动告警轮询')
    return
  }
  
  // 立即获取一次告警
  fetchAlarmData()
  
  // 每5秒轮询一次
  alarmPollingTimer = setInterval(() => {
    fetchAlarmData()
  }, 5000)
}

// 语音播报
const speakWarning = (text) => {
  if ('speechSynthesis' in window) {
    // 取消之前的语音
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0  // 语速
    utterance.pitch = 1.0  // 音调
    utterance.volume = 1.0  // 音量
    
    window.speechSynthesis.speak(utterance)
  }
}

// 组件挂载时启动告警轮询
onMounted(() => {
  startAlarmPolling()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (alarmPollingTimer) {
    clearInterval(alarmPollingTimer)
  }
})
</script>

<style scoped>
.review-notice {
  background: #fff8e1;
  border: 1px solid rgba(250, 204, 21, 0.15);
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  max-width: 420px;
  min-height: 80px;
  overflow-y: auto;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.alarm-notice {
  background: #fef2f2;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.no-alarm {
  background: #f0fdf4;
  border: 1px solid rgba(34, 197, 94, 0.15);
}

.notice-title { 
  font-weight: 600; 
  color: #92400e;
  margin-bottom: 8px;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.alarm-notice .notice-title {
  color: #991b1b;
}

.no-alarm .notice-title {
  color: #166534;
}

.alarm-count {
  font-size: 0.85rem;
  color: #dc2626;
  font-weight: 500;
}

.notice-content { 
  font-size: 0.9rem; 
  color: #7c6a45; 
  line-height: 1.5;
}

.no-alarm-text {
  color: #16a34a;
  font-size: 0.875rem;
}

.alarm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alarm-item {
  background: rgba(255, 255, 255, 0.6);
  padding: 8px 10px;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
}

.alarm-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.alarm-content {
  font-size: 0.875rem;
  color: #7f1d1d;
  line-height: 1.4;
}
</style>
