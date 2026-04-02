<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
})

const emit = defineEmits(['toggle', 'delete', 'edit', 'toggleChild'])

const expanded = ref(false)

const urgencyClass = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

const children = computed(() => props.task.children ?? [])
const doneCount = computed(() => children.value.filter(c => c.done).length)
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 transition-colors"
    :class="{
      'border-red-400':   task.urgency === 'high',
      'border-amber-400': task.urgency === 'medium',
      'border-green-400': task.urgency === 'low',
    }"
  >
    <div class="flex items-start gap-3 p-4">
      <button
        data-testid="toggle"
        class="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors"
        :class="task.status === 'done' ? 'bg-gray-800 border-gray-800' : 'border-gray-300 hover:border-gray-500'"
        @click="emit('toggle', task.id)"
      />

      <div
        data-testid="card-body"
        class="flex-1 min-w-0 cursor-pointer"
        @click="emit('edit', task)"
      >
        <p
          class="text-sm font-medium text-gray-800 dark:text-gray-100 break-words"
          :class="{ 'line-through text-gray-400': task.status === 'done' }"
        >
          {{ task.title }}
        </p>
        <p v-if="task.description" class="mt-0.5 text-xs text-gray-500 break-words">
          {{ task.description }}
        </p>
      </div>

      <button
        v-if="children.length > 0"
        data-testid="children-count"
        class="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        @click.stop="expanded = !expanded"
      >
        {{ doneCount }}/{{ children.length }}
      </button>

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

    <ul v-if="expanded && children.length > 0" data-testid="children-list" class="px-4 pb-3 space-y-1.5">
      <li v-for="child in children" :key="child.id" class="flex items-start gap-2">
        <button
          :data-testid="`child-checkbox-${child.id}`"
          class="mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 transition-colors"
          :class="child.done ? 'bg-gray-700 border-gray-700' : 'border-gray-300 hover:border-gray-500'"
          @click="emit('toggleChild', task.id, child.id)"
        />
        <div class="min-w-0">
          <span
            class="text-xs text-gray-700 dark:text-gray-300 break-words"
            :class="{ 'line-through text-gray-400': child.done }"
          >{{ child.title }}</span>
          <p
            v-if="child.description"
            :data-testid="`child-description-${child.id}`"
            class="text-xs text-gray-400 break-words"
          >{{ child.description }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
