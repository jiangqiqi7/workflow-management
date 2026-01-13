<template>
  <div class="workflow-steps">
    <el-steps 
      :active="activeStepIndex" 
      finish-status="success"
      align-center
    >
      <el-step 
        v-for="(step, index) in normalizedSteps" 
        :key="index"
        :title="step.title"
        :status="getStepStatus(step)"
        @click="$emit('step-click', index)"
        style="cursor: pointer;"
      />
    </el-steps>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

defineEmits(['step-click'])

// 步骤类型到顺序的映射
const STEP_ORDER = {
  'leak_test': 0,      // 测漏
  'cleaning': 1,       // 清洗
  'rinsing': 2,        // 漂洗
  'disfection': 3,     // 消毒
  'final_rinsing': 4,  // 终末漂洗
  'drying': 5          // 干燥
}

// 固定的步骤名称（用于显示）
const STEP_TITLES = ['测漏', '清洗', '漂洗', '消毒', '终末漂洗', '干燥']

// 规范化步骤数据：对后端返回的步骤进行排序，并统一使用固定的标题
const normalizedSteps = computed(() => {
  // 如果没有步骤数据，返回默认的5个步骤
  if (!props.steps || props.steps.length === 0) {
    return STEP_TITLES.map((title, index) => ({
      title,
      status: 'wait',
      sequence_no: index.toString(),
      step_type: Object.keys(STEP_ORDER)[index]
    }))
  }
  
  // 对后端返回的步骤按照 step_type 排序
  const sortedSteps = [...props.steps].sort((a, b) => {
    const orderA = STEP_ORDER[a.step_type] ?? 999
    const orderB = STEP_ORDER[b.step_type] ?? 999
    return orderA - orderB
  })
  
  // 使用固定的标题名称，但保留后端返回的状态
  return sortedSteps.map((step, index) => ({
    ...step,
    title: STEP_TITLES[index] || step.sequence_no,  // 使用固定标题，如果没有则使用后端返回的
    sequence_no: index.toString()
  }))
})

// 计算当前激活步骤的索引
const activeStepIndex = computed(() => {
  return normalizedSteps.value.findIndex(step => step.status === 'doing')
})

// 转换状态格式为 Element Plus 的格式
const getStepStatus = (step) => {
  if (step.status === 'finished') return 'success'
  if (step.status === 'doing') return 'process'
  if (step.status === 'pending') return 'wait'
  return 'wait'
}
</script>

<style scoped>
.workflow-steps {
  margin: 2rem 0;
  padding: 0 2rem;
}

/* 自定义步骤条样式 */
:deep(.el-step__title) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-step__head) {
  cursor: pointer;
}

:deep(.el-step__head:hover) {
  transform: scale(1.1);
  transition: transform 0.3s ease;
}
</style>