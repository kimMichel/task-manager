import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from './stores/tasks.js'
import App from './App.vue'

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
})
