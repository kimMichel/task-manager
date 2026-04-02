<script setup>
import { ref } from 'vue'

const MAX_CHILDREN = 10

const emit = defineEmits(['submit'])

const title = ref('')
const urgency = ref('low')
const description = ref('')
const validationError = ref('')
const children = ref([])

function addChild() {
  if (children.value.length < MAX_CHILDREN) {
    children.value.push({ title: '', description: '' })
  }
}

function removeChild(index) {
  children.value.splice(index, 1)
}

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
    children: children.value.filter(c => c.title.trim()).map(c => ({ title: c.title.trim(), description: c.description })),
  })
  title.value = ''
  urgency.value = 'low'
  description.value = ''
  children.value = []
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

    <div v-if="children.length > 0" class="space-y-1.5">
      <div v-for="(child, i) in children" :key="i" class="space-y-1">
        <div class="flex items-center gap-2">
          <input
            :data-testid="`child-input-${i}`"
            v-model="child.title"
            type="text"
            placeholder="Sub-item…"
            maxlength="200"
            class="flex-1 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 transition-colors"
          />
          <button
            type="button"
            :data-testid="`remove-child-${i}`"
            class="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
            @click="removeChild(i)"
          >×</button>
        </div>
        <input
          :data-testid="`child-description-${i}`"
          v-model="child.description"
          type="text"
          placeholder="Sub-item description (optional)"
          maxlength="1000"
          class="w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 transition-colors"
        />
      </div>
    </div>

    <button
      type="button"
      data-testid="add-child"
      :disabled="children.length >= MAX_CHILDREN"
      class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      @click="addChild"
    >+ Add sub-item</button>

    <p v-if="validationError" class="text-xs text-red-500">{{ validationError }}</p>
  </form>
</template>
