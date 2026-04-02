import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskForm from './TaskForm.vue'

describe('TaskForm', () => {
  it('renders a title input and urgency select', () => {
    const wrapper = mount(TaskForm)
    expect(wrapper.find('input[data-testid="title"]').exists()).toBe(true)
    expect(wrapper.find('select[data-testid="urgency"]').exists()).toBe(true)
  })

  it('emits submit with trimmed title, urgency, and description', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('input[data-testid="title"]').setValue('  My task  ')
    await wrapper.find('select[data-testid="urgency"]').setValue('high')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toMatchObject({
      title: 'My task',
      urgency: 'high',
    })
  })

  it('clears the form after submit', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('input[data-testid="title"]').setValue('My task')
    await wrapper.find('select[data-testid="urgency"]').setValue('low')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.find('input[data-testid="title"]').element.value).toBe('')
  })

  it('does not emit submit when title is empty', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('shows a validation message when submitted with empty title', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Title is required')
  })
})
