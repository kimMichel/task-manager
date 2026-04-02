<script setup>
import { ref } from 'vue'
import { useTaskStore } from '../stores/tasks.js'
import TaskItem from './TaskItem.vue'
import TaskEditModal from './TaskEditModal.vue'

const store = useTaskStore()
const editingTask = ref(null)

function onToggle(id) {
  const task = store.tasks.find(t => t.id === id)
  if (task) {
    store.editTask(id, { status: task.status === 'done' ? 'pending' : 'done' })
  }
}

async function onSave(updates) {
  await store.editTask(editingTask.value.id, updates)
  editingTask.value = null
}

function onToggleChild(taskId, childId) {
  const task = store.tasks.find(t => t.id === taskId)
  if (!task) return
  const children = (task.children ?? []).map(c =>
    c.id === childId ? { ...c, done: !c.done } : c
  )
  store.editTask(taskId, { children })
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
        @edit="editingTask = $event"
        @toggleChild="onToggleChild"
      />
    </div>

    <TaskEditModal
      v-if="editingTask"
      :task="editingTask"
      @save="onSave"
      @cancel="editingTask = null"
    />
  </div>
</template>
