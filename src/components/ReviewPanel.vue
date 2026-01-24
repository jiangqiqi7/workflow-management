<template>
  <div class="review-panel">
    <slot name="notice"></slot>
    <h3 class="section-title">操作记录</h3>
    <div class="review-content">
      <div
        v-if="sortedRecords && sortedRecords.length"
        v-for="(item, index) in sortedRecords"
        :key="index"
        class="review-item"
      >
        <span class="check-mark" :class="{ checked: item.status === 'finished' || item.status === 'done' || item.status === 'doing' }">
          {{ (item.status === 'finished' || item.status === 'done' || item.status === 'doing') ? '✓' : '○' }}
        </span>
        <div class="item-content">
          <div class="item-name">{{ getStepName(item.step_type) }} - {{ getStatusName(item.status) }}</div>
          <div class="item-time" v-if="item.start_time">{{ formatTime(item.start_time) }} {{ item.operator_id || '' }}</div>
          <div class="item-detail" v-if="item.device_id">设备: {{ item.device_id }}</div>
        </div>
      </div>
      <div v-else class="empty-records">暂无操作记录</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
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

// 步骤类型到中文名称的映射
const STEP_NAMES = {
  'leak_test': '测漏',
  'cleaning': '清洗',
  'rinsing': '漂洗',
  'disfection': '消毒',
  'final_rinsing': '终末漂洗',
  'drying': '干燥'
}

// 获取步骤名称
const getStepName = (stepType) => {
  return STEP_NAMES[stepType] || stepType
}

// 对记录按步骤顺序排序
const sortedRecords = computed(() => {
  if (!props.records || props.records.length === 0) {
    return []
  }
  
  return [...props.records].sort((a, b) => {
    const orderA = STEP_ORDER[a.step_type] ?? 999
    const orderB = STEP_ORDER[b.step_type] ?? 999
    return orderA - orderB
  })
})

// 状态映射
const getStatusName = (status) => {
  const statusMap = {
    'doing': '进行中',
    'done': '已完成',
    'finished': '已完成',
    'pending': '等待中',
    'waiting': '等待中'
  }
  return statusMap[status] || status
}

// 格式化时间戳
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.review-panel {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  /* Keep a stable size so layout doesn't shift when content changes */
  max-width: 420px;
}

.title {
  font-weight: bold;
  color: #374151;
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.review-content {
  margin-top: 1rem;
  /* fixed-size content area: wrap text and scroll when overflowing */
  max-height: 260px;
  height: 260px                                                                                                                                                                                                                                                                                                                                                                                                                                 ;
  overflow-y: auto;
  overflow-wrap: anywhere;
  word-break: break-word;
  padding-right: 6px; /* space for scrollbar */
}

.section-title {
  font-weight: 600;
  /* make this selector specific to h3 headings when used as h3.section-title */
  font-size: 1rem; /* closer to typical h3 visual weight */
  line-height: 1.25;
  color: #374151;
  margin-bottom: 0.75rem;
}

.review-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.check-mark {
  font-weight: bold;
  color: #9ca3af;
}

.check-mark.checked {
  color: #10b981;
}

.item-content {
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #374151;
  white-space: normal;
  word-break: break-word;
}

.item-detail {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 2px;
}

.item-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}
</style>