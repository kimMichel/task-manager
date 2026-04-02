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

  it('applies a high urgency border color for high urgency tasks', () => {
    const wrapper = mount(TaskItem, { props: { task: { ...TASK, urgency: 'high' } } })
    expect(wrapper.html()).toContain('border-red')
  })

  it('applies a medium urgency border color for medium urgency tasks', () => {
    const wrapper = mount(TaskItem, { props: { task: { ...TASK, urgency: 'medium' } } })
    expect(wrapper.html()).toContain('border-amber')
  })

  it('applies a low urgency border color for low urgency tasks', () => {
    const wrapper = mount(TaskItem, { props: { task: { ...TASK, urgency: 'low' } } })
    expect(wrapper.html()).toContain('border-green')
  })

  it('emits edit with the full task when the card body is clicked', async () => {
    const wrapper = mount(TaskItem, { props: { task: TASK } })
    await wrapper.find('[data-testid="card-body"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0][0]).toEqual(TASK)
  })
})

const TASK_WITH_CHILDREN = {
  ...TASK,
  children: [
    { id: 'c1', title: 'Sub item one', done: false },
    { id: 'c2', title: 'Sub item two', done: true },
  ],
}

describe('TaskItem — children', () => {
  it('shows a collapsed count badge when task has children', () => {
    const wrapper = mount(TaskItem, { props: { task: TASK_WITH_CHILDREN } })
    expect(wrapper.find('[data-testid="children-count"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="children-count"]').text()).toContain('1/2')
  })

  it('does not show children list by default (collapsed)', () => {
    const wrapper = mount(TaskItem, { props: { task: TASK_WITH_CHILDREN } })
    expect(wrapper.find('[data-testid="children-list"]').exists()).toBe(false)
  })

  it('expands the children list when count badge is clicked', async () => {
    const wrapper = mount(TaskItem, { props: { task: TASK_WITH_CHILDREN } })
    await wrapper.find('[data-testid="children-count"]').trigger('click')
    expect(wrapper.find('[data-testid="children-list"]').exists()).toBe(true)
  })

  it('emits toggleChild with task id and child id when a checkbox is clicked', async () => {
    const wrapper = mount(TaskItem, { props: { task: TASK_WITH_CHILDREN } })
    await wrapper.find('[data-testid="children-count"]').trigger('click')
    await wrapper.find('[data-testid="child-checkbox-c1"]').trigger('click')
    expect(wrapper.emitted('toggleChild')).toBeTruthy()
    expect(wrapper.emitted('toggleChild')[0]).toEqual([TASK_WITH_CHILDREN.id, 'c1'])
  })
})
