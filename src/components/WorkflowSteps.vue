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
  'disfection': 3,   // 消毒（兼容后端数据）
  'final_rinsing': 4,  // 终末漂洗
  'drying': 5,          // 干燥
  'wash_machine': 6    // 机洗
}

// 固定的步骤名称（用于显示）
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

// 规范化步骤数据：对后端返回的步骤进行排序，并统一使用固定的标题
const normalizedSteps = computed(() => {
  // 如果没有步骤数据，返回默认的6个步骤
  if (!props.steps || props.steps.length === 0) {
    return STEP_TITLES.map((title, index) => ({
      title,
      status: 'wait',
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