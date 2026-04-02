<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
})

const emit = defineEmits(['save', 'cancel'])

const title = ref(props.task.title)
const description = ref(props.task.description)
const urgency = ref(props.task.urgency)
const titleError = ref('')

watch(() => props.task, (t) => {
  title.value = t.title
  description.value = t.description
  urgency.value = t.urgency
  titleError.value = ''
})

function save() {
  if (!title.value.trim()) {
    titleError.value = 'Title is required'
    return
  }
  emit('save', { title: title.value.trim(), description: description.value, urgency: urgency.value })
}
</script>

<template>
  <div
    data-testid="modal-backdrop"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    @click.self="emit('cancel')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Edit Task</h2>

      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Title</label>
        <input
          v-model="title"
          data-testid="edit-title"
          type="text"
          maxlength="200"
          class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <p v-if="titleError" class="text-xs text-red-500">{{ titleError }}</p>
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
        <textarea
          v-model="description"
          data-testid="edit-description"
          rows="3"
          maxlength="1000"
          class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
        />
      </div>

      <div class="space-y-1">
        <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Urgency</label>
        <select
          v-model="urgency"
          data-testid="edit-urgency"
          class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          data-testid="modal-cancel"
          class="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          data-testid="modal-save"
          class="px-4 py-2 text-sm rounded-lg bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors font-medium"
          @click="save"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
