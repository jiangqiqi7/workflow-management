<template>
  <div class="review-notice" v-if="info">
    <div class="notice-message">{{ info.message }}</div>
    <div class="notice-note" v-if="info.note">{{ info.note }}</div>
  </div>
</template>

<script setup>
defineProps({
  info: {
    type: Object,
    required: false,
    default: () => null
  }
})
</script>

<style scoped>
.review-notice {
  background: #fff8e1;
  border: 1px solid rgba(250, 204, 21, 0.15);
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  /* fixed height so the notice box doesn't resize with content */
  max-width: 420px;
  height: 160px;
  overflow-y: auto;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.notice-message { font-weight: 600; color: #92400e }
.notice-note { font-size: 0.9rem; color: #7c6a45; margin-top: 4px }
</style>
