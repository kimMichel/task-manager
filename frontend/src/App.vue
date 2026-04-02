<script setup>
import { onMounted } from 'vue'
import { useTaskStore } from './stores/tasks.js'
import { useTheme } from './composables/useTheme.js'
import TaskForm from './components/TaskForm.vue'
import TaskList from './components/TaskList.vue'

const store = useTaskStore()
const { isDark, toggle } = useTheme()

onMounted(() => store.loadTasks())

function handleSubmit(payload) {
  store.addTask(payload)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <div class="max-w-xl mx-auto px-4 py-10 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">Today's Tasks</h1>
        <button
          @click="toggle"
          class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-lg"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
      <TaskForm @submit="handleSubmit" />
      <TaskList />
    </div>
  </div>
</template>

