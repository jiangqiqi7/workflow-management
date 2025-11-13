<template>
  <div class="review-panel">
    <slot name="notice"></slot>
    <h3 class="section-title">操作记录</h3>
    <div class="review-content">
      <div
        v-if="records && records.length"
        v-for="(item, index) in records"
        :key="index"
        class="review-item"
      >
        <span class="check-mark" :class="{ checked: item.checked }">
          {{ item.checked ? '✓' : '○' }}
        </span>
        <div class="item-content">
          <div class="item-name">{{ item.name }}</div>
          <div class="item-time">{{ item.time }}</div>
        </div>
      </div>
      <div v-else class="empty-records">暂无操作记录</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})
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

.item-time {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}
</style>