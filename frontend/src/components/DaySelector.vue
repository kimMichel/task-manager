<script setup>
const props = defineProps({
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

function today() {
  return new Date().toISOString().slice(0, 10)
}

function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}
</script>

<template>
  <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
    <button
      v-for="{ label, date } in [{ label: 'Today', date: today() }, { label: 'Yesterday', date: yesterday() }]"
      :key="label"
      class="px-4 py-1.5 text-sm rounded-lg transition-colors"
      :class="modelValue === date
        ? 'active bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm font-medium'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
      @click="emit('update:modelValue', date)"
    >
      {{ label }}
    </button>
  </div>
</template>
