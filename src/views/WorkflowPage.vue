<template>
  <div class="workflow-page">
    <div class="container">
      <div class="back-button-wrapper">
        <el-button @click="handleBack" icon="ArrowLeft">返回列表</el-button>
      </div>
      
      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="error" class="error-state">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ error }}</span>
      </div>
      <div v-else-if="!workflowData" class="empty-state">
        <el-icon><InfoFilled /></el-icon>
        <span>当前没有正在进行的任务</span>
      </div>
      <template v-else>
        <WorkflowHeader :headerInfo="workflowData.base_info" />
        <WorkflowSteps
            :steps="workflowData.step_records"
            :activeStep="activeStep"
            @step-click="handleStepClick"
        />

        <div class="content-grid">
          <WorkArea :activeStep="activeStep" :ws-url="wsUrl" :source-ip="sourceIp" @task-id-updated="handleTaskIdUpdated" />
          <div>
            <ReviewNotice />
            <ReviewPanel :records="workflowData.step_records" />
          </div>
        </div>

        <OperationButtons />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Loading, WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import WorkflowHeader from '../components/WorkflowHeader.vue'
import WorkflowSteps from '../components/WorkflowSteps.vue'
import WorkArea from '../components/WorkArea.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import ReviewNotice from '../components/ReviewNotice.vue'
import OperationButtons from '../components/OperationButtons.vue'

const props = defineProps({
  workflowId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['back'])

const workflowData = ref(null)
const activeStep = ref('')
const loading = ref(true)
const error = ref('')
let pollingTimer = null

// 返回列表
const handleBack = () => {
  emit('back')
}

// 后端基础地址
const backendBase = import.meta.env.VITE_BACKEND_BASE_URL || 'http://116.204.65.72:8881'

// API地址：开发环境使用代理，生产环境直接请求
const apiUrl = import.meta.env.DEV 
  ? '/api/gdmp/v1/api/nt/get_specific_task'
  : `${backendBase}/gdmp/v1/api/nt/get_specific_task`

// 视频流WebSocket地址
const wsUrl = computed(() => {
  return import.meta.env.VITE_VIDEO_STREAM_URL || 'ws://117.50.241.174:8000/ai/video'
})

// 提供给 WorkArea 的 source_ip
const sourceIp = computed(() => {
  return workflowData.value?.base_info?.source_ip || null
})

// 获取工作台信息
const fetchWorkflowData = async () => {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskid: props.workflowId
      })
    })
    const data = await response.json()
    
    if (data.code === 200) {
      if (data.message === '当前没有正在进行的任务') {
        workflowData.value = null
        taskId.value = null
      } else {
        workflowData.value = data
        // 设置当前激活步骤
        if (data.current_step) {
          activeStep.value = data.current_step.sequence_no
        }
      }
      error.value = ''
    } else {
      error.value = data.message || '获取数据失败'
    }
  } catch (err) {
    error.value = '网络请求失败: ' + err.message
    console.error('获取工作台信息失败:', err)
  } finally {
    loading.value = false
  }
  /* 临时注释 - 测试用
  // 模拟数据 - 测试用
  workflowData.value = {
    code: 200,
    base_info: {
      endoscope_id: "0007316094",
      model: "NULL",
      manufacturer: "富士",
      status: "intact",
      total_wash_count: 0
    },
    current_step: {
      sequence_no: "0",
      step_type: null,
      device_id: "172.16.77.221",
      operator_id: "0007326306",
      status: "doing"
    },
    alarm_message: "最近没有告警提醒",
    step_records: [
      { sequence_no: "0", status: "pending" },
      { sequence_no: "1", status: "pending" },
      { sequence_no: "2", status: "pending" },
      { sequence_no: "3", status: "doing" }
    ]
  }
  loading.value = false
   */
}

// 轮询更新数据
const startPolling = () => {
  pollingTimer = setInterval(() => {
    fetchWorkflowData()
  }, 5000) // 每5秒更新一次
}

const handleStepClick = (sequenceNo) => {
  activeStep.value = sequenceNo
}

const handleTaskIdUpdated = (newTaskId) => {
  taskId.value = newTaskId
  console.log('TaskId updated from WorkArea:', newTaskId)
}

onMounted(() => {
  fetchWorkflowData()
  startPolling()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
.workflow-page {
  padding: 2rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.back-button-wrapper {
  margin-bottom: 1rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin: 2rem 0;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-state .el-icon {
  font-size: 3rem;
  color: #409eff;
}

.error-state .el-icon {
  font-size: 3rem;
  color: #f56c6c;
}

.empty-state .el-icon {
  font-size: 3rem;
  color: #909399;
}

.loading-state span,
.error-state span,
.empty-state span {
  font-size: 1.125rem;
  color: #606266;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>