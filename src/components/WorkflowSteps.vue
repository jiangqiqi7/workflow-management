<template>
  <div class="workflow-steps">
    <el-steps 
      :active="activeStepIndex" 
      finish-status="success"
      align-center
    >
      <el-step 
        v-for="step in steps" 
        :key="step.id"
        :title="step.name"
        :status="getStepStatus(step)"
        @click="$emit('step-click', step.name)"
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

// 计算当前激活步骤的索引
const activeStepIndex = computed(() => {
  return props.steps.findIndex(step => step.status === 'active')
})

// 转换状态格式为 Element Plus 的格式
const getStepStatus = (step) => {
  if (step.status === 'completed') return 'success'
  if (step.status === 'active') return 'process'
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