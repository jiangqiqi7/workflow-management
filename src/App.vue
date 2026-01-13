<template>
  <div id="app">
    <WorkflowList v-if="currentView === 'list'" />
    <WorkflowPage v-else :workflowId="selectedWorkflowId" @back="goToList" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import WorkflowList from './views/WorkflowList.vue'
import WorkflowPage from './views/WorkflowPage.vue'

const currentView = ref('list')
const selectedWorkflowId = ref(null)

// 查看详情
const viewDetail = (event) => {
  selectedWorkflowId.value = event.detail.id
  currentView.value = 'detail'
}

// 返回列表
const goToList = () => {
  currentView.value = 'list'
  selectedWorkflowId.value = null
}

onMounted(() => {
  window.addEventListener('view-workflow-detail', viewDetail)
})
</script>

<style>
#app {
  min-height: 100vh;
  background-color: #f3f4f6;
}
</style>