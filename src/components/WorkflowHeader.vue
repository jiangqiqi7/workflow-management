<template>
  <div class="workflow-header">
    <div class="header-grid">
      <div class="header-item">
        <span class="label">内镜编号：</span>
        <span class="value">{{ headerInfo.endoscope_id }}</span>
      </div>
      <div class="header-item">
        <span class="label">型号：</span>
        <span class="value">{{ headerInfo.model }}</span>
      </div>
      <div class="header-item">
        <span class="label">厂商：</span>
        <span class="value">{{ headerInfo.manufacturer }}</span>
      </div>
      <div class="header-item">
        <span class="label">物理状态：</span>
        <span class="value">{{ headerInfo.status }}</span>
      </div>
      <div class="header-item">
        <span class="label">清洗次数：</span>
        <span class="value">{{ headerInfo.total_wash_count }}</span>
      </div>
      <div class="header-item">
        <span class="label">姓名：</span>
        <span class="value">{{ headerInfo.patient_name || '-' }}</span>
      </div>
      <div class="header-item">
        <span class="label">科室：</span>
        <span class="value">{{ headerInfo.department || '-' }}</span>
      </div>
      <div class="header-item">
        <span class="label">床号：</span>
        <span class="value">{{ headerInfo.bed_no !== null && headerInfo.bed_no !== undefined ? headerInfo.bed_no : '-' }}</span>
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
  grid-template-columns: repeat(4, 1fr);
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