import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from './stores/tasks.js'
import App from './App.vue'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

let pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

describe('App', () => {
  it('calls loadTasks on mount', async () => {
    const store = useTaskStore()
    vi.spyOn(store, 'loadTasks').mockResolvedValue()
    mount(App, { global: { plugins: [pinia] } })
    await flushPromises()
    expect(store.loadTasks).toHaveBeenCalled()
  })

  it('calls addTask when TaskForm emits submit', async () => {
    const store = useTaskStore()
    vi.spyOn(store, 'loadTasks').mockResolvedValue()
    vi.spyOn(store, 'addTask').mockResolvedValue()
    const wrapper = mount(App, { global: { plugins: [pinia] } })
    await flushPromises()
    await wrapper.findComponent({ name: 'TaskForm' }).vm.$emit('submit', { title: 'New task', urgency: 'low' })
    expect(store.addTask).toHaveBeenCalledWith({ title: 'New task', urgency: 'low' })
  })

  it('calls loadTasks with today date on mount', async () => {
    const store = useTaskStore()
    vi.spyOn(store, 'loadTasks').mockResolvedValue()
    mount(App, { global: { plugins: [pinia] } })
    await flushPromises()
    expect(store.loadTasks).toHaveBeenCalledWith(today())
  })

  it('calls loadTasks with yesterday date when DaySelector emits yesterday', async () => {
    const store = useTaskStore()
    vi.spyOn(store, 'loadTasks').mockResolvedValue()
    const wrapper = mount(App, { global: { plugins: [pinia] } })
    await flushPromises()
    await wrapper.findComponent({ name: 'DaySelector' }).vm.$emit('update:modelValue', yesterday())
    await flushPromises()
    expect(store.loadTasks).toHaveBeenCalledWith(yesterday())
  })
})
