<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const title = ref('')
const urgency = ref('low')
const description = ref('')
const validationError = ref('')

function handleSubmit() {
  if (!title.value.trim()) {
    validationError.value = 'Title is required'
    return
  }
  validationError.value = ''
  emit('submit', {
    title: title.value.trim(),
    urgency: urgency.value,
    description: description.value,
  })
  title.value = ''
  urgency.value = 'low'
  description.value = ''
}
</script>

<template>
  <form class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3 transition-colors" @submit.prevent="handleSubmit">
    <div class="flex gap-2">
      <input
        data-testid="title"
        v-model="title"
        type="text"
        placeholder="New task…"
        class="flex-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 outline-none focus:border-gray-400 dark:focus:border-gray-400 transition-colors"
      />
      <select
        data-testid="urgency"
        v-model="urgency"
        class="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-2 outline-none focus:border-gray-400 transition-colors bg-white"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button
        type="submit"
        class="text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Add
      </button>
    </div>

    <input
      v-model="description"
      type="text"
      placeholder="Description (optional)"
      class="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 outline-none focus:border-gray-400 transition-colors"
    />

    <p v-if="validationError" class="text-xs text-red-500">{{ validationError }}</p>
  </form>
</template>
