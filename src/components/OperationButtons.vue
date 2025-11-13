<template>
  <div class="operation-buttons">
    <div class="buttons-container">
      <button
          v-for="op in operations"
          :key="op.id"
          class="operation-btn"
          type="button"
          :aria-label="op.label"
          :title="op.label"
          @click="handleClick(op)"
      >
        <span class="btn-label">{{ op.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
// Operations are fixed (not provided by mock data)
const operations = [
  { id: 1, label: '工作台' },
  { id: 2, label: '设备故障' },
  { id: 3, label: '查询' },
  { id: 4, label: '数据集成' }
]

const emit = defineEmits(['operation'])

const handleClick = (operation) => {
  // emit the operation id/label for parent handling
  emit('operation', operation)
}
</script>

<style scoped>
.operation-buttons {
  border-top: 1px solid #eef2f7;
  padding-top: 1.25rem;
  margin-top: 1.75rem;
}

.buttons-container {
  display: flex;
  justify-content: center;
  gap: 1rem; /* tighter spacing for a compact group */
  flex-wrap: wrap;
}

.operation-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  min-width: 88px;
  height: 42px;
  border: 1px solid #e6eef5;
  border-radius: 0.6rem; /* softer pill */
  background: linear-gradient(180deg,#ffffff 0%, #f7fafc 100%); /* soft, low-contrast */
  color: #0f172a; /* dark text for good contrast on light bg */
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(2,6,23,0.04); /* much subtler shadow */
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
  font-weight: 600;
}

.operation-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(2,6,23,0.06);
}

.operation-btn:active {
  transform: translateY(0);
  box-shadow: inset 0 1px 4px rgba(2,6,23,0.03);
}

.operation-btn:focus {
  outline: none;
}

.operation-btn:focus-visible {
  box-shadow: 0 6px 14px rgba(2,6,23,0.05), 0 0 0 4px rgba(59,130,246,0.06);
}

.btn-label {
  font-size: 0.95rem;
  color: inherit; /* inherit white */
  text-align: center;
  width: 100%;
}

.footer-text {
  text-align: center;
  margin-top: 0.9rem;
  font-size: 0.875rem;
  color: #6b7280;
}

@media (max-width: 480px) {
  .buttons-container { gap: 0.6rem }
  .operation-btn { min-width: 72px; padding: 0.45rem 0.7rem; height: 40px }
  .btn-label { font-size: 0.85rem }
}
</style>