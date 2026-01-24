<template>
  <div class="list-steps">
    <div class="steps-container">
      <div 
        v-for="(step, index) in normalizedSteps" 
        :key="index"
        class="step-item"
        :class="getStepClass(step)"
      >
        <div class="step-icon">
          <el-icon v-if="step.status === 'finished'"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="step.status === 'doing'" class="is-loading"><Loading /></el-icon>
          <el-icon v-else-if="step.status === 'error'"><CircleCloseFilled /></el-icon>
          <span v-else class="step-number">{{ index + 1 }}</span>
        </div>
        <div class="step-title">{{ step.title }}</div>
        <div v-if="index < normalizedSteps.length - 1" class="step-line"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CircleCheckFilled, Loading, CircleCloseFilled } from '@element-plus/icons-vue'

const props = defineProps({
  steps: {
    type: Array,
    required: true
  },
  activeStep: {
    type: String,
    default: ''
  }
})

// 步骤类型到顺序的映射
const STEP_ORDER = {
  'leak_test': 0,      // 测漏
  'cleaning': 1,       // 清洗
  'rinsing': 2,        // 漂洗
  'disfection': 3,   // 消毒（兼容后端数据）
  'final_rinsing': 4,  // 终末漂洗
  'drying': 5,          // 干燥
  'wash_machine': 6    // 机洗
}

// 固定的步骤名称
const STEP_TITLES = ['测漏', '清洗', '漂洗', '消毒', '终末漂洗', '干燥']

// 判断是否为机洗模式
const isMachineWash = computed(() => {
  if (!props.steps || props.steps.length === 0) {
    return false
  }
  
  // 检查是否有wash_machine类型的步骤
  const hasMachineWashStep = props.steps.some(step => step.step_type === 'wash_machine')
  if (hasMachineWashStep) return true
  
  // 找到漂洗步骤（sequence_no为'3'）
  const rinsingStep = props.steps.find(step => step.sequence_no === '3')
  if (!rinsingStep) return false
  
  // 找到漂洗后的下一步
  const nextStep = props.steps.find(step => parseInt(step.sequence_no) > 3)
  
  // 如果下一步的sequence_no是7，则为机洗模式
  return nextStep && nextStep.sequence_no === '7'
})

// 规范化步骤数据
const normalizedSteps = computed(() => {
  if (!props.steps || props.steps.length === 0) {
    return STEP_TITLES.map((title, index) => ({
      title,
      status: 'pending',
      sequence_no: (index + 1).toString(),
      step_type: Object.keys(STEP_ORDER)[index]
    }))
  }
  
  const sortedSteps = [...props.steps].sort((a, b) => {
    const seqA = parseInt(a.sequence_no)
    const seqB = parseInt(b.sequence_no)
    return seqA - seqB
  })
  
  // 如果是机洗模式
  if (isMachineWash.value) {
    const result = []
    
    sortedSteps.forEach((step) => {
      const seqNo = parseInt(step.sequence_no)
      
      if (seqNo <= 3) {
        // 前三步保持不变：测漏、清洗、漂洗
        result.push({
          ...step,
          title: STEP_TITLES[seqNo - 1] || step.sequence_no
        })
      } else if (seqNo === 7 || step.step_type === 'wash_machine') {
        // sequence_no为7的步骤或step_type为wash_machine，合并为"机洗"
        result.push({
          ...step,
          title: '机洗',
          isMachineWashStep: true
        })
      }
    })
    
    return result
  }
  
  // 非机洗模式，按原逻辑处理
  return sortedSteps.map((step) => {
    const seqNo = parseInt(step.sequence_no)
    return {
      ...step,
      title: STEP_TITLES[seqNo - 1] || step.sequence_no
    }
  })
})

// 获取步骤样式类
const getStepClass = (step) => {
  return {
    'is-finished': step.status === 'finished',
    'is-doing': step.status === 'doing',
    'is-pending': step.status === 'pending',
    'is-error': step.status === 'error'
  }
}
</script>

<style scoped>
.list-steps {
  padding: 1rem 0;
}

.steps-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.step-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  z-index: 1;
}

.step-item.is-finished .step-icon {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

.step-item.is-doing .step-icon {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.step-item.is-error .step-icon {
  background-color: #ef4444;
  border-color: #ef4444;
  color: white;
}

.step-icon .el-icon {
  font-size: 1.25rem;
}

.step-number {
  font-size: 0.875rem;
  font-weight: 600;
}

.step-title {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.step-item.is-finished .step-title {
  color: #10b981;
  font-weight: 500;
}

.step-item.is-doing .step-title {
  color: #409eff;
  font-weight: 600;
}

.step-item.is-error .step-title {
  color: #ef4444;
  font-weight: 600;
}

.step-line {
  position: absolute;
  top: 1rem;
  left: 50%;
  right: -50%;
  height: 2px;
  background-color: #e5e7eb;
  transition: all 0.3s ease;
  z-index: 0;
}

.step-item.is-finished .step-line {
  background-color: #10b981;
}
</style>
