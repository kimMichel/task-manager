import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskEditModal from './TaskEditModal.vue'

const TASK = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  title: 'Write tests',
  description: 'Use Vitest',
  urgency: 'high',
  status: 'pending',
  createdAt: '2026-04-02T10:00:00.000Z',
}

describe('TaskEditModal', () => {
  it('renders a dialog with the task fields pre-filled', () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK } })
    expect(wrapper.find('[data-testid="edit-title"]').element.value).toBe('Write tests')
    expect(wrapper.find('[data-testid="edit-description"]').element.value).toBe('Use Vitest')
    expect(wrapper.find('[data-testid="edit-urgency"]').element.value).toBe('high')
  })

  it('emits save with updated fields when form is submitted', async () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK } })
    await wrapper.find('[data-testid="edit-title"]').setValue('Updated title')
    await wrapper.find('[data-testid="edit-urgency"]').setValue('low')
    await wrapper.find('[data-testid="modal-save"]').trigger('click')
    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')[0][0]).toMatchObject({
      title: 'Updated title',
      urgency: 'low',
      description: 'Use Vitest',
    })
  })

  it('does not emit save when title is empty', async () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK } })
    await wrapper.find('[data-testid="edit-title"]').setValue('')
    await wrapper.find('[data-testid="modal-save"]').trigger('click')
    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK } })
    await wrapper.find('[data-testid="modal-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('emits cancel when backdrop is clicked', async () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK } })
    await wrapper.find('[data-testid="modal-backdrop"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})

const TASK_WITH_CHILDREN = {
  ...TASK,
  children: [
    { id: 'c1', title: 'Sub item one', done: false },
    { id: 'c2', title: 'Sub item two', done: true },
  ],
}

describe('TaskEditModal — children', () => {
  it('renders existing child item titles as inputs', () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK_WITH_CHILDREN } })
    expect(wrapper.find('[data-testid="child-edit-input-c1"]').element.value).toBe('Sub item one')
    expect(wrapper.find('[data-testid="child-edit-input-c2"]').element.value).toBe('Sub item two')
  })

  it('includes updated children in the save payload', async () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK_WITH_CHILDREN } })
    await wrapper.find('[data-testid="child-edit-input-c1"]').setValue('Updated sub item')
    await wrapper.find('[data-testid="modal-save"]').trigger('click')
    const saved = wrapper.emitted('save')[0][0]
    expect(saved.children[0].title).toBe('Updated sub item')
    expect(saved.children[1].title).toBe('Sub item two')
  })

  it('adds a new child item row in the modal', async () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK_WITH_CHILDREN } })
    await wrapper.find('[data-testid="modal-add-child"]').trigger('click')
    expect(wrapper.find('[data-testid="child-edit-input-new-0"]').exists()).toBe(true)
  })

  it('removes a child item row in the modal', async () => {
    const wrapper = mount(TaskEditModal, { props: { task: TASK_WITH_CHILDREN } })
    await wrapper.find('[data-testid="modal-remove-child-c1"]').trigger('click')
    expect(wrapper.find('[data-testid="child-edit-input-c1"]').exists()).toBe(false)
  })

  it('disables add child button when 10 items are present', async () => {
    const tenChildren = Array.from({ length: 10 }, (_, i) => ({ id: `c${i}`, title: `Item ${i}`, done: false }))
    const wrapper = mount(TaskEditModal, { props: { task: { ...TASK, children: tenChildren } } })
    expect(wrapper.find('[data-testid="modal-add-child"]').attributes('disabled')).toBeDefined()
  })
})

describe('TaskEditModal — child description', () => {
  it('pre-fills child description inputs', () => {
    const task = {
      ...TASK,
      children: [{ id: 'c1', title: 'Sub item', description: 'Some detail', done: false }],
    }
    const wrapper = mount(TaskEditModal, { props: { task } })
    expect(wrapper.find('[data-testid="child-edit-description-c1"]').element.value).toBe('Some detail')
  })

  it('includes child description in the save payload', async () => {
    const task = {
      ...TASK,
      children: [{ id: 'c1', title: 'Sub item', description: 'Old detail', done: false }],
    }
    const wrapper = mount(TaskEditModal, { props: { task } })
    await wrapper.find('[data-testid="child-edit-description-c1"]').setValue('New detail')
    await wrapper.find('[data-testid="modal-save"]').trigger('click')
    const saved = wrapper.emitted('save')[0][0]
    expect(saved.children[0].description).toBe('New detail')
  })
})
