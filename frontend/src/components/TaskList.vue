<script setup>
import { useTaskStore } from '../stores/tasks.js'
import TaskItem from './TaskItem.vue'

const store = useTaskStore()

function onToggle(id) {
  const task = store.tasks.find(t => t.id === id)
  if (task) {
    store.editTask(id, { status: task.status === 'done' ? 'pending' : 'done' })
  }
}
</script>

<template>
  <div>
    <div v-if="store.loading" data-testid="loading" class="py-8 text-center text-sm text-gray-400">
      Loading…
    </div>

    <p v-else-if="store.error" class="text-sm text-red-500 py-4">
      {{ store.error }}
    </p>

    <p v-else-if="store.tasks.length === 0" class="py-8 text-center text-sm text-gray-400">
      No tasks for today.
    </p>

    <div v-else class="space-y-2">
      <TaskItem
        v-for="task in store.sortedTasks"
        :key="task.id"
        :task="task"
        @toggle="onToggle"
        @delete="store.removeTask($event)"
      />
    </div>
  </div>
</template>
