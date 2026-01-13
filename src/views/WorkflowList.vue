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

      <div v-else class="workflow-list">
        <div v-for="item in workflowList" :key="item.id" class="workflow-item">
          <div class="item-left">
            <div class="user-info">
              <div class="user-details">
                <span class="user-name">{{ item.userName }}</span>
                <span class="endoscope-id">{{ item.endoscopeId }}</span>
              </div>
            </div>
          </div>

          <div class="item-center">
            <ListSteps 
              :steps="item.steps" 
              :activeStep="item.currentStep"
            />
            
            <div v-if="item.error" class="error-message">
              <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
              <div class="error-content">
                <div class="error-title">{{ item.error.stepName }} - 操作异常</div>
                <div class="error-detail">{{ item.error.message }}</div>
              </div>
            </div>
            
            <WorkflowTimer 
              v-else-if="item.currentStep"
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
import { Loading, WarningFilled, InfoFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import ListSteps from '../components/ListSteps.vue'
import WorkflowTimer from '../components/WorkflowTimer.vue'

const workflowList = ref([])
const loading = ref(true)
const error = ref('')
const roomName = ref('')
const roomId2 = ref('')
let pollingTimer = null

// 步骤类型映射
const STEP_NAMES = {
  'leak_test': '测漏',
  'cleaning': '清洗',
  'rinsing': '漂洗',
  'disfection': '消毒',
  'final_rinsing': '终末漂洗',
  'drying': '干燥'
}

// 后端基础地址
const backendBase = import.meta.env.VITE_BACKEND_BASE_URL || 'http://116.204.65.72:8881'

// API地址
const apiUrl = import.meta.env.DEV 
  ? '/api/gdmp/v1/api/nt/get_workspace_list'
  : `${backendBase}/gdmp/v1/api/nt/get_workspace_list`

// 获取步骤名称
const getStepName = (currentStep, steps) => {
  const step = steps.find(s => s.sequence_no === currentStep)
  return step ? STEP_NAMES[step.step_type] || step.step_type : ''
}

// 获取工作流列表
const fetchWorkflowList = async () => {
  // 如果没有 roomId2，先获取
  if (!roomId2.value) {
    await fetchRoomName()
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room: roomId2.value
      })
    })
    const data = await response.json()
    
    // 处理成功响应
    if (data.code === 200) {
      // 有任务数据
      if (data.data && data.data.length > 0) {
        // 从第一个任务中提取 room_name（如果存在）
        if (data.data[0].room_name) {
          roomName.value = data.data[0].room_name
        }
        
        // 直接使用返回的数据，字段名已经匹配
        workflowList.value = data.data.map(item => ({
          id: item.id,
          userName: item.userName || '未知操作员',
          endoscopeId: item.endoscopeId || '',
          steps: item.steps || [],
          currentStep: item.currentStep || '',
          stepStartTime: item.stepStartTime || new Date().toISOString()
        }))
        error.value = ''
      } else {
        // 没有任务数据（当前洗消间没有正在进行的任务）
        workflowList.value = []
        error.value = ''
      }
    } else if (data.code === 500) {
      // 服务器错误
      error.value = data.message || '服务器内部错误'
      console.error('服务器错误:', data.error)
      workflowList.value = []
    } else {
      // 其他错误情况
      error.value = data.message || '获取数据失败'
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
        { step_type: 'leak_test', status: 'finished', sequence_no: '0' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '1' },
        { step_type: 'rinsing', status: 'finished', sequence_no: '2' },
        { step_type: 'disfection', status: 'doing', sequence_no: '3' },
        { step_type: 'final_rinsing', status: 'pending', sequence_no: '4' },
        { step_type: 'drying', status: 'pending', sequence_no: '5' }
      ],
      currentStep: '3',
      stepStartTime: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    },
    {
      id: '002',
      userName: '张华',
      endoscopeId: 'BL5923',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '0' },
        { step_type: 'cleaning', status: 'error', sequence_no: '1' },
        { step_type: 'rinsing', status: 'pending', sequence_no: '2' },
        { step_type: 'disfection', status: 'pending', sequence_no: '3' },
        { step_type: 'final_rinsing', status: 'pending', sequence_no: '4' },
        { step_type: 'drying', status: 'pending', sequence_no: '5' }
      ],
      currentStep: '1',
      stepStartTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      error: {
        stepName: '清洗',
        message: '水压异常，检测到水压低于标准值'
      }
    },
    {
      id: '003',
      userName: '王芳',
      endoscopeId: 'CK7234',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '0' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '1' },
        { step_type: 'rinsing', status: 'finished', sequence_no: '2' },
        { step_type: 'disfection', status: 'finished', sequence_no: '3' },
        { step_type: 'final_rinsing', status: 'finished', sequence_no: '4' },
        { step_type: 'drying', status: 'doing', sequence_no: '5' }
      ],
      currentStep: '5',
      stepStartTime: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: '004',
      userName: '刘强',
      endoscopeId: 'DM8765',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '0' },
        { step_type: 'cleaning', status: 'doing', sequence_no: '1' },
        { step_type: 'rinsing', status: 'pending', sequence_no: '2' },
        { step_type: 'disfection', status: 'pending', sequence_no: '3' },
        { step_type: 'final_rinsing', status: 'pending', sequence_no: '4' },
        { step_type: 'drying', status: 'pending', sequence_no: '5' }
      ],
      currentStep: '1',
      stepStartTime: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    },
    {
      id: '005',
      userName: '陈敏',
      endoscopeId: 'EN9234',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '0' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '1' },
        { step_type: 'rinsing', status: 'doing', sequence_no: '2' },
        { step_type: 'disfection', status: 'pending', sequence_no: '3' },
        { step_type: 'final_rinsing', status: 'pending', sequence_no: '4' },
        { step_type: 'drying', status: 'pending', sequence_no: '5' }
      ],
      currentStep: '2',
      stepStartTime: new Date(Date.now() - 4 * 60 * 1000).toISOString()
    },
    {
      id: '006',
      userName: '赵磊',
      endoscopeId: 'FK1098',
      steps: [
        { step_type: 'leak_test', status: 'finished', sequence_no: '0' },
        { step_type: 'cleaning', status: 'finished', sequence_no: '1' },
        { step_type: 'rinsing', status: 'finished', sequence_no: '2' },
        { step_type: 'disfection', status: 'finished', sequence_no: '3' },
        { step_type: 'final_rinsing', status: 'error', sequence_no: '4' },
        { step_type: 'drying', status: 'pending', sequence_no: '5' }
      ],
      currentStep: '4',
      stepStartTime: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
      error: {
        stepName: '终末漂洗',
        message: '终末漂洗时间超时，未检测到完成信号'
      }
    }
  ]
  error.value = ''
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
    const response = await fetch('http://116.204.65.72:8881/gdmp/v1/api/nt/get_room_id')
    const data = await response.json()
    console.log('Room ID API响应:', data)
    if (data.room_id2) {
      roomId2.value = data.room_id2
    }
    if (data.room_id3) {
      roomName.value = data.room_id3
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
  max-width: 1200px;
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
  gap: 0.875rem;
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
