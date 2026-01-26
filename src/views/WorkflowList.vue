<template>
  <div class="workflow-list-page">
    <div class="container">
      <div class="header">
        <h1>{{ roomName || '洗消间管理' }}</h1>
      </div>

      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="error" class="error-state">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ error }}</span>
      </div>

      <div v-else-if="!workflowList || workflowList.length === 0" class="empty-state">
        <el-icon><InfoFilled /></el-icon>
        <span>当前洗消间暂无工作任务</span>
      </div>

      <div v-else class="workflow-list" :class="{ 'two-columns': workflowList.length > 5 }">
        <div v-for="item in workflowList" :key="item.id" class="workflow-item">
          <div class="item-left">
            <div class="user-info">
              <div class="user-details">
                <span class="user-name">{{ item.userName }}</span>
                <span class="endoscope-id">{{ item.endoscopeId }}</span>
              </div>
            </div>
            <div class="progress-indicator">
              <div 
                class="indicator-light" 
                :style="{ backgroundColor: getStepColor(item.currentStep, item.steps) }"
              ></div>
            </div>
          </div>

          <div class="item-center">
            <ListSteps 
              :steps="item.steps" 
              :activeStep="item.currentStep"
            />
            
            <div v-if="getTaskAlarm(item.id)" class="error-message">
              <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
              <div class="error-content">
                <div class="error-title">{{ getTaskAlarm(item.id).alarm_type || '告警提示' }}</div>
                <div class="error-detail">{{ getTaskAlarm(item.id).message }}</div>
              </div>
            </div>
            
            <WorkflowTimer 
              v-else-if="item.currentStep && item.currentStep !== ''"
              :startTime="item.stepStartTime"
              :stepName="getStepName(item.currentStep, item.steps)"
            />
          </div>

          <div class="item-right">
            <el-button 
              type="primary" 
              @click="viewDetail(item.id)"
            >
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { parseBusinessScriptContent, unwrapBusinessScriptResponse } from '../utils/helpers.js'
import { getBackendBase, getReviewNoticeBase } from '../utils/config.js'
import { Loading, WarningFilled, InfoFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import ListSteps from '../components/ListSteps.vue'
import WorkflowTimer from '../components/WorkflowTimer.vue'

const workflowList = ref([])
const loading = ref(true)
const error = ref('')
const roomName = ref('')
const roomId2 = ref('')
const taskAlarms = ref({}) // 存储每个任务的告警信息 { taskId: alarmData }
let pollingTimer = null

// 步骤类型映射
const STEP_NAMES = {
  'leak_test': '测漏',
  'cleaning': '清洗',
  'rinsing': '漂洗',
  'disfection': '消毒',  // 兼容后端数据
  'final_rinsing': '终末漂洗',
  'drying': '干燥',
  'wash_machine': '进入机洗'
}

// 步骤序号映射
const STEP_NAMES_BY_SEQ = {
  '1': '测漏',
  '2': '清洗',
  '3': '漂洗',
  '4': '消毒',
  '5': '终末漂洗',
  '6': '干燥',
  '7': '进入机洗'
}

// 获取API地址（从配置文件）
const getApiUrl = () => {
  const backendBase = getBackendBase()
  return import.meta.env.DEV 
    ? '/cms/v1/module/business_script/runScriptByCode?code=get_workspace_list'
    : `${backendBase}/cms/v1/module/business_script/runScriptByCode?code=get_workspace_list`
}

const getAlarmApiUrl = () => {
  const backendBase = getBackendBase()
  return `${backendBase}/cms/v1/module/business_script/runScriptByCode?code=get_latest_alarm`
}

const getReviewNoticeAlarmUrl = (taskId) => {
  const reviewNoticeBase = getReviewNoticeBase()
  return import.meta.env.DEV
    ? `/task/${taskId}/alarms`
    : `${reviewNoticeBase}/task/${taskId}/alarms`
}

const getRoomIdApiUrl = () => {
  const backendBase = getBackendBase()
  return `${backendBase}/cms/v1/module/business_script/runScriptByCode?code=get_room_id`
}

// 判断是否为机洗模式
const isMachineWash = (steps) => {
  if (!steps || steps.length === 0) return false
  
  // 检查是否有sequence_no为7的步骤（机洗步骤）
  const hasMachineWashStep = steps.some(step => step.sequence_no === '7' || step.step_type === 'wash_machine')
  if (!hasMachineWashStep) return false
  
  // 检查清洗步骤后的下一步
  const nextStep = steps.find(step => parseInt(step.sequence_no) > 2)
  
  // 如果清洗后直接跳到机洗（sequence_no为7），则为机洗模式
  return nextStep && nextStep.sequence_no === '7'
}

// 获取步骤名称
const getStepName = (currentStep, steps) => {
  // 如果是机洗模式，并且当前步骤是sequence_no为7的步骤
  if (isMachineWash(steps) && currentStep === '7') {
    return '机洗'
  }
  
  // 优先使用序号映射
  if (STEP_NAMES_BY_SEQ[currentStep]) {
    return STEP_NAMES_BY_SEQ[currentStep]
  }
  
  // 其次使用步骤类型映射
  const step = steps.find(s => s.sequence_no === currentStep)
  return step ? STEP_NAMES[step.step_type] || step.step_type : ''
}

// 根据当前步骤获取指示灯颜色（每个步骤一个颜色）
const getStepColor = (currentStep, steps) => {
  if (!currentStep || currentStep === '') return '#9ca3af' // 灰色（未开始）
  
  // 步骤颜色映射
  const stepColors = {
    '1': '#dc2626',  // 测漏 - 深红色
    '2': '#ef4444',  // 清洗 - 红色
    '3': '#f97316',  // 漂洗 - 橙色
    '4': '#eab308',  // 消毒 - 黄色
    '5': '#86efac',  // 终末漂洗 - 浅绿色
    '6': '#15803d',  // 干燥 - 深绿色
    '7': '#15803d'   // 机洗 - 深绿色
  }
  
  return stepColors[currentStep] || '#6b7280' // 默认灰色
}

// 获取任务的最新告警记录（从 get_latest_alarm 接口）
const fetchLatestAlarm = async (taskId) => {
  if (!taskId) return null
  
  try {
    const response = await fetch(getAlarmApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId
      })
    })
    const data = await response.json()
    
    // 支持 content 为字符串的情况：去掉外围引号并解析
    let alarmPayload = null
    const payload = unwrapBusinessScriptResponse(data)
    if (payload.code === 0 && payload.data) {
      alarmPayload = payload.data
    } else if (payload && typeof payload === 'object' && !payload.code) {
      // If no code/data structure, use payload directly
      alarmPayload = payload
    }

    if (alarmPayload) {
      return {
        source: 'latest_alarm',
        ...alarmPayload
      }
    }
  } catch (err) {
    console.error(`获取任务 ${taskId} 的最新告警失败:`, err)
  }
  return null
}

// 获取任务告警列表（从 ReviewNotice 接口）
const fetchReviewNoticeAlarms = async (taskId) => {
  if (!taskId) return null
  
  try {
    const url = getReviewNoticeAlarmUrl(taskId)
    const response = await fetch(url)
    const data = await response.json()
    
    // 返回格式: { task_id, total, alarms: [] }
    if (data.task_id !== undefined && data.total > 0 && data.alarms && data.alarms.length > 0) {
      // 返回最新的一条告警
      const latestAlarm = data.alarms[0]
      return {
        source: 'review_notice',
        message: latestAlarm.message || latestAlarm.description || '检测到异常',
        timestamp: latestAlarm.timestamp,
        alarm_type: '告警提示'
      }
    }
  } catch (err) {
    console.error(`获取任务 ${taskId} 的 ReviewNotice 告警失败:`, err)
  }
  return null
}

// 获取任务的所有告警信息（合并两个接口）
const fetchTaskAlarm = async (taskId) => {
  if (!taskId) return null
  
  // 同时从两个接口获取告警
  const [latestAlarm, reviewNoticeAlarm] = await Promise.all([
    fetchLatestAlarm(taskId),
    fetchReviewNoticeAlarms(taskId)
  ])
  
  // 优先返回 latest_alarm 接口的数据，如果没有则使用 review_notice 接口的数据
  return latestAlarm || reviewNoticeAlarm
}

// 获取工作流列表
const fetchWorkflowList = async () => {
  // 如果没有 roomId2，先获取
  if (!roomId2.value) {
    await fetchRoomName()
  }
  
  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room: roomId2.value
      })
    })
    const data = await response.json()
    const payload = unwrapBusinessScriptResponse(data)
    
    // 处理成功响应
    if (payload.code === 200) {
      // 有任务数据
      if (payload.data && payload.data.length > 0) {
        // 从第一个任务中提取 room_name（如果存在）
        if (payload.data[0].room_name) {
          roomName.value = payload.data[0].room_name
        }
        
        // 直接使用返回的数据，字段名已经匹配
        workflowList.value = payload.data.map(item => ({
          id: item.id,
          userName: item.userName || '未知操作员',
          endoscopeId: item.endoscopeId || '',
          steps: item.steps || [],
          currentStep: item.currentStep || '',
          stepStartTime: item.stepStartTime || new Date().toISOString()
        }))
        error.value = ''
        
        // 获取每个任务的告警信息
        for (const item of workflowList.value) {
          const alarmData = await fetchTaskAlarm(item.id)
          if (alarmData) {
            taskAlarms.value[item.id] = alarmData
          } else {
            // 清除之前的告警数据（如果告警已解决）
            delete taskAlarms.value[item.id]
          }
        }
      } else {
        // 没有任务数据（当前洗消间没有正在进行的任务）
        workflowList.value = []
        error.value = ''
      }
    } else if (payload.code === 500) {
      // 服务器错误
      error.value = payload.message || '服务器内部错误'
      console.error('服务器错误:', payload.error)
      workflowList.value = []
    } else {
      // 其他错误情况
      error.value = payload.message || '获取数据失败'
      workflowList.value = []
    }
  } catch (err) {
    error.value = '网络请求失败: ' + err.message
    console.error('获取工作流列表失败:', err)
    // 出错时使用模拟数据
    loadMockData()
  } finally {
    loading.value = false
  }
}

// 加载模拟数据
const loadMockData = () => {
  workflowList.value = [
    {
      id: '001',
      userName: '李明',
      endoscopeId: 'AL4876',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '1' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '2' },
        { step_type: 'rinsing', status: 'finished', sequence_no: '3' },
        { step_type: 'disfection', status: 'doing', sequence_no: '4' },
        { step_type: 'final_rinsing', status: 'pending', sequence_no: '5' },
        { step_type: 'drying', status: 'pending', sequence_no: '6' }
      ],
      currentStep: '4',
      stepStartTime: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: '002',
      userName: '张华（机洗）',
      endoscopeId: 'BL5923',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '1' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '2' },
        { step_type: 'rinsing', status: 'finished', sequence_no: '3' },
        { step_type: 'machine_wash', status: 'doing', sequence_no: '7' }
      ],
      currentStep: '7',
      stepStartTime: new Date(Date.now() - 8 * 60 * 1000).toISOString()
    },
    {
      id: '003',
      userName: '王芳',
      endoscopeId: 'CK7234',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '1' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '2' },
        { step_type: 'rinsing', status: 'finished', sequence_no: '3' },
        { step_type: 'disfection', status: 'finished', sequence_no: '4' },
        { step_type: 'final_rinsing', status: 'finished', sequence_no: '5' },
        { step_type: 'drying', status: 'doing', sequence_no: '6' }
      ],
      currentStep: '6',
      stepStartTime: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: '004',
      userName: '刘强',
      endoscopeId: 'DM8765',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '1' },
        { step_type: 'cleaning', status: 'doing', sequence_no: '2' },
        { step_type: 'rinsing', status: 'pending', sequence_no: '3' },
        { step_type: 'disfection', status: 'pending', sequence_no: '4' },
        { step_type: 'final_rinsing', status: 'pending', sequence_no: '5' },
        { step_type: 'drying', status: 'pending', sequence_no: '6' }
      ],
      currentStep: '2',
      stepStartTime: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    },
    {
      id: '005',
      userName: '陈敏',
      endoscopeId: 'EN9234',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '1' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '2' },
        { step_type: 'rinsing', status: 'doing', sequence_no: '3' },
        { step_type: 'disfection', status: 'pending', sequence_no: '4' },
        { step_type: 'final_rinsing', status: 'pending', sequence_no: '5' },
        { step_type: 'drying', status: 'pending', sequence_no: '6' }
      ],
      currentStep: '3',
      stepStartTime: new Date(Date.now() - 4 * 60 * 1000).toISOString()
    },
    {
      id: '006',
      userName: '赵磊（机洗）',
      endoscopeId: 'FK1098',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '1' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '2' },
        { step_type: 'rinsing', status: 'finished', sequence_no: '3' },
        { step_type: 'machine_wash', status: 'pending', sequence_no: '7' }
      ],
      currentStep: '3',
      stepStartTime: new Date(Date.now() - 6 * 60 * 1000).toISOString()
    }
  ]
  error.value = ''
}

// 获取任务的告警信息（用于模板显示）
const getTaskAlarm = (taskId) => {
  return taskAlarms.value[taskId] || null
}

// 查看详情
const viewDetail = (id) => {
  window.dispatchEvent(new CustomEvent('view-workflow-detail', { detail: { id } }))
}

// 轮询数据
const startPolling = () => {
  pollingTimer = setInterval(() => {
    fetchWorkflowList()
  }, 5000) // 每5秒刷新一次
}

// 获取房间名称
const fetchRoomName = async () => {
  try {
    const response = await fetch(getRoomIdApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json()
    console.log('Room ID API响应:', data)
    const decodeEscapes = (str) => {
      try {
        return JSON.parse('"' + String(str).replace(/"/g, '\\"') + '"')
      } catch (_) {
        return str
      }
    }

    const parseRoomContent = (raw) => {
      if (!raw) return {}
      if (typeof raw === 'object' && raw !== null) return raw
      const text = String(raw).trim()
      // Try parsing as JSON first (handles correct `{"room_id1":...}` strings)
      try {
        const obj = JSON.parse(text)
        return obj
      } catch (_) {}
      // Fallback: tolerate malformed content with spaces or underscores
      const id1 = (text.match(/room[_\s]*id1"\s*:\s*"([^"]+)"/i) || [])[1] || null
      const id2 = (text.match(/room[_\s]*id2"\s*:\s*"([^"]+)"/i) || [])[1] || null
      const id3Raw = (text.match(/room[_\s]*id3"\s*:\s*"([^"]+)"/i) || [])[1] || null
      const id3 = id3Raw ? decodeEscapes(id3Raw) : null
      return { room_id1: id1, room_id2: id2, room_id3: id3 }
    }

      const content = parseBusinessScriptContent(data.content)
    if (content.room_id2) {
      roomId2.value = content.room_id2
    }
    if (content.room_id3) {
      roomName.value = content.room_id3
    }
  } catch (err) {
    console.error('获取房间名称失败:', err)
  }
}

onMounted(() => {
  fetchRoomName()
  fetchWorkflowList()
  startPolling()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
.workflow-list-page {
  min-height: 100vh;
  background-color: #f3f4f6;
  padding: 2rem 0;
}

.container {
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.0rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state .el-icon,
.error-state .el-icon,
.empty-state .el-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state .el-icon {
  color: #409eff;
}

.error-state .el-icon {
  color: #f56c6c;
}

.empty-state .el-icon {
  color: #909399;
}

.workflow-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

.workflow-list.two-columns {
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.workflow-item {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.workflow-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.item-left {
  flex-shrink: 0;
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.user-name {
  font-size: 2.00rem;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.endoscope-id {
  font-size: 1.00rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  display: inline-block;
  width: fit-content;
}

.progress-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
}

.indicator-light {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.3);
  transition: background-color 0.5s ease, box-shadow 0.5s ease;
  position: relative;
}

.indicator-light::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 30%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent);
  border-radius: 50%;
  filter: blur(3px);
}

.item-center {
  flex: 1;
  min-width: 0;
}

.item-right {
  flex-shrink: 0;
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-left: 4px solid #ef4444;
  border-radius: 0.5rem;
  margin-top: 0.625rem;
}

.error-icon {
  font-size: 1.25rem;
  color: #ef4444;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 0.25rem;
}

.error-detail {
  font-size: 0.8125rem;
  color: #dc2626;
  line-height: 1.5;
}
</style>
