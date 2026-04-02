<script setup>
import { onMounted } from 'vue'
import { useTaskStore } from './stores/tasks.js'
import TaskForm from './components/TaskForm.vue'
import TaskList from './components/TaskList.vue'

const store = useTaskStore()

onMounted(() => store.loadTasks())

function handleSubmit(payload) {
  store.addTask(payload)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-xl mx-auto px-4 py-10 space-y-6">
      <h1 class="text-2xl font-semibold text-gray-800">Today's Tasks</h1>
      <TaskForm @submit="handleSubmit" />
      <TaskList />
    </div>
  </div>
</template>

