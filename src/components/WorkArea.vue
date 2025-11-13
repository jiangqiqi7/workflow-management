<template>
  <div class="work-area">
    <div class="content">
        <div class="video-panel-full">
          <template v-if="videoSources && videoSources[0]">
            <video
              class="video-player-full"
              :src="videoSources[0]"
              controls
              autoplay
              muted
              playsinline
            ></video>
          </template>

          <template v-else>
            <div class="video-empty-full">
              <div class="empty-text">暂无视频</div>
              <button class="retry-btn" @click="$emit('retry', 0)">重试</button>
            </div>
          </template>
        </div>
      </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeStep: {
    type: String,
    required: true
  },
  // optional array of video URLs; if empty, panels show placeholders
  videoSources: {
    type: Array,
    default: () => []
  },
  // how many panels to show when sources are empty
  panels: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['retry'])

// show a single monitoring panel (first source) per user request
const panelsCount = computed(() => 1)
</script>

<style scoped>
.work-area {
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.5rem; /* reduce padding so video can fill more */
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  color: #374151;
  margin-bottom: 1rem;
}

.content {
  /* allow the content area to stretch and let video-panel-full fill it */
  margin-top: 0;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0; /* allow children to shrink properly inside flex */
}

.current-step {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.step-highlight {
  font-weight: bold;
  color: #3b82f6;
  font-size: 1rem;
}

.work-content {
  margin-top: 2rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 0.25rem;
}

.placeholder {
  text-align: center;
  color: #9ca3af;
}

/* video area styles */
.video-area .hint {
  font-size: 0.95rem;
  color: #374151;
  margin-bottom: 12px;
  font-weight: 600;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.video-panel {
  background: #fff;
  border: 1px dashed rgba(15,23,42,0.06);
  border-radius: 8px;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.camera-icon { font-size: 2rem }
.empty-text { font-size: 0.95rem }
.retry-btn { background: #eef2ff; border: none; color: #2563eb; padding: 6px 10px; border-radius: 6px; cursor: pointer }

@media (max-width: 640px) {
  .video-grid { grid-template-columns: 1fr }
}

/* full video styles */
.video-panel-full {
  width: 100%;
  flex: 1 1 auto; /* fill the remaining vertical space */
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  /* increase min height so the video can be taller (slightly smaller now) */
  min-height: 480px;
}

.video-player-full {
  /* make video narrower and taller (portrait-ish) */
  width: min(360px, 85%);
  aspect-ratio: 3 / 4; /* width : height = 3:4 -> taller than wide */
  object-fit: cover;
  display: block;
}

@media (max-width: 700px) {
  .video-panel-full { min-height: 380px }
  .video-player-full { width: min(320px, 92%); aspect-ratio: 3/4 }
}

.video-empty-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #cbd5e1;
}

.video-empty-full .camera-icon { font-size: 3.5rem }
.video-empty-full .empty-text { font-size: 1.1rem }

.video-panel-full .retry-btn { background: rgba(255,255,255,0.08); color: #fff; border-radius: 6px; padding: 8px 12px }
</style>