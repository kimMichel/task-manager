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
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
      <TaskForm @submit="handleSubmit" />
      <TaskList />
    </div>
  </div>
</template>

