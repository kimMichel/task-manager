<script setup>
const props = defineProps({
  task: { type: Object, required: true },
})

const emit = defineEmits(['toggle', 'delete'])

const urgencyClass = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}
</script>

<template>
  <div class="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <button
      data-testid="toggle"
      class="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors"
      :class="task.status === 'done' ? 'bg-gray-800 border-gray-800' : 'border-gray-300 hover:border-gray-500'"
      @click="emit('toggle', task.id)"
    />

    <div class="flex-1 min-w-0">
      <p
        class="text-sm font-medium text-gray-800 break-words"
        :class="{ 'line-through text-gray-400': task.status === 'done' }"
      >
        {{ task.title }}
      </p>
      <p v-if="task.description" class="mt-0.5 text-xs text-gray-500 break-words">
        {{ task.description }}
      </p>
    </div>

    <span
      class="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize"
      :class="urgencyClass[task.urgency]"
    >
      {{ task.urgency }}
    </span>

    <button
      data-testid="delete"
      class="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
      @click="emit('delete', task.id)"
    >
      ×
    </button>
  </div>
</template>
