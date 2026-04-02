import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../stores/tasks.js'
import TaskList from './TaskList.vue'

const TASK_A = { id: 'aaaaaaaa-0000-0000-0000-000000000001', title: 'Task A', urgency: 'low', status: 'pending', description: '', createdAt: '2026-04-02T10:00:00.000Z' }
const TASK_B = { id: 'bbbbbbbb-0000-0000-0000-000000000002', title: 'Task B', urgency: 'high', status: 'done', description: '', createdAt: '2026-04-02T11:00:00.000Z' }

let pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

function mountList() {
  return mount(TaskList, { global: { plugins: [pinia] } })
}

describe('TaskList', () => {
  it('shows a loading indicator when store is loading', () => {
    const store = useTaskStore()
    store.loading = true
    const wrapper = mountList()
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
  })

  it('shows an empty state message when there are no tasks', () => {
    const wrapper = mountList()
    expect(wrapper.text()).toContain('No tasks')
  })

  it('renders one TaskItem per task', () => {
    const store = useTaskStore()
    store.tasks = [TASK_A, TASK_B]
    const wrapper = mountList()
    expect(wrapper.findAllComponents({ name: 'TaskItem' })).toHaveLength(2)
  })

  it('shows an error message when store has an error', () => {
    const store = useTaskStore()
    store.error = 'Failed to load tasks'
    const wrapper = mountList()
    expect(wrapper.text()).toContain('Failed to load tasks')
  })

  it('opens the edit modal when a task card emits edit', async () => {
    const store = useTaskStore()
    store.tasks = [TASK_A]
    const wrapper = mountList()
    await wrapper.findComponent({ name: 'TaskItem' }).vm.$emit('edit', TASK_A)
    expect(wrapper.findComponent({ name: 'TaskEditModal' }).exists()).toBe(true)
  })

  it('closes the edit modal on cancel', async () => {
    const store = useTaskStore()
    store.tasks = [TASK_A]
    const wrapper = mountList()
    await wrapper.findComponent({ name: 'TaskItem' }).vm.$emit('edit', TASK_A)
    await wrapper.findComponent({ name: 'TaskEditModal' }).vm.$emit('cancel')
    expect(wrapper.findComponent({ name: 'TaskEditModal' }).exists()).toBe(false)
  })
})
