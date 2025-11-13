<template>
  <div class="workflow-page">
    <div class="container">
      <WorkflowHeader :headerInfo="workflowData.headerInfo" />
      <WorkflowSteps
          :steps="workflowData.steps"
          :activeStep="activeStep"
          @step-click="handleStepClick"
      />

      <div class="content-grid">
        <WorkArea :activeStep="activeStep" />
        <div>
          <ReviewNotice :info="workflowData.reviewInfo" />
          <ReviewPanel :records="workflowData.reviewRecords" />
        </div>
      </div>

      <OperationButtons />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import WorkflowHeader from '../components/WorkflowHeader.vue'
import WorkflowSteps from '../components/WorkflowSteps.vue'
import WorkArea from '../components/WorkArea.vue'
import ReviewPanel from '../components/ReviewPanel.vue'
import ReviewNotice from '../components/ReviewNotice.vue'
import OperationButtons from '../components/OperationButtons.vue'
import { mockData } from '../mock/data.js'

const workflowData = ref(mockData)
const activeStep = ref('清洗')

const handleStepClick = (stepName) => {
  activeStep.value = stepName
}
</script>

<style scoped>
.workflow-page {
  padding: 2rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin: 2rem 0;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>