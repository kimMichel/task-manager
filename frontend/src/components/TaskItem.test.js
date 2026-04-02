import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskItem from './TaskItem.vue'

const TASK = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  title: 'Write tests',
  description: 'Use Vitest',
  urgency: 'high',
  status: 'pending',
  createdAt: '2026-04-02T10:00:00.000Z',
}

describe('TaskItem', () => {
  it('renders the task title', () => {
    const wrapper = mount(TaskItem, { props: { task: TASK } })
    expect(wrapper.text()).toContain('Write tests')
  })

  it('renders the urgency badge', () => {
    const wrapper = mount(TaskItem, { props: { task: TASK } })
    expect(wrapper.text()).toContain('high')
  })

  it('renders the description when non-empty', () => {
    const wrapper = mount(TaskItem, { props: { task: TASK } })
    expect(wrapper.text()).toContain('Use Vitest')
  })

  it('applies done styling when status is done', () => {
    const doneTask = { ...TASK, status: 'done' }
    const wrapper = mount(TaskItem, { props: { task: doneTask } })
    expect(wrapper.html()).toContain('line-through')
  })

  it('emits toggle when status button is clicked', async () => {
    const wrapper = mount(TaskItem, { props: { task: TASK } })
    await wrapper.find('[data-testid="toggle"]').trigger('click')
    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')[0]).toEqual([TASK.id])
  })

  it('emits delete when delete button is clicked', async () => {
    const wrapper = mount(TaskItem, { props: { task: TASK } })
    await wrapper.find('[data-testid="delete"]').trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual([TASK.id])
  })
})
