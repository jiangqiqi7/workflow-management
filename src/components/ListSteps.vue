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
  'disfection': 3,     // 消毒
  'final_rinsing': 4,  // 终末漂洗
  'drying': 5          // 干燥
}

// 固定的步骤名称
const STEP_TITLES = ['测漏', '清洗', '漂洗', '消毒', '终末漂洗', '干燥']

// 规范化步骤数据
const normalizedSteps = computed(() => {
  if (!props.steps || props.steps.length === 0) {
    return STEP_TITLES.map((title, index) => ({
      title,
      status: 'pending',
      sequence_no: index.toString(),
      step_type: Object.keys(STEP_ORDER)[index]
    }))
  }
  
  const sortedSteps = [...props.steps].sort((a, b) => {
    const orderA = STEP_ORDER[a.step_type] ?? 999
    const orderB = STEP_ORDER[b.step_type] ?? 999
    return orderA - orderB
  })
  
  return sortedSteps.map((step, index) => ({
    ...step,
    title: STEP_TITLES[index] || step.sequence_no,
    sequence_no: index.toString()
  }))
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
