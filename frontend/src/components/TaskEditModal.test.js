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
