<template>
  <div class="workflow-header">
    <div class="header-grid">
      <div class="header-item">
        <span class="label">内镜号：</span>
        <span class="value">{{ headerInfo.内镜号 }}</span>
      </div>
      <div class="header-item">
        <span class="label">清洗次数：</span>
        <span class="value">{{ headerInfo.清洗次数 }}</span>
      </div>
      <div class="header-item">
        <span class="label">上次清洗：</span>
        <span class="value">{{ headerInfo.上次清洗 }}</span>
      </div>
      <div class="header-item">
        <span class="label">所属科室：</span>
        <span class="value">{{ headerInfo.所属科室 }}</span>
      </div>
      <div class="header-item">
        <span class="label">上次病人：</span>
        <span class="value">{{ headerInfo.上次病人 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  headerInfo: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.workflow-header {
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.header-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.header-item {
  font-size: 0.875rem;
}

.label {
  color: #6b7280;
}

.value {
  font-weight: 600;
  color: #111827;
}

@media (max-width: 1024px) {
  .header-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .header-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>