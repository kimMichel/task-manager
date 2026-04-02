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

describe('TaskForm — children', () => {
  it('renders an add child item button', () => {
    const wrapper = mount(TaskForm)
    expect(wrapper.find('[data-testid="add-child"]').exists()).toBe(true)
  })

  it('shows a child input row when add child is clicked', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('[data-testid="add-child"]').trigger('click')
    expect(wrapper.find('[data-testid="child-input-0"]').exists()).toBe(true)
  })

  it('includes children in the submit payload', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('[data-testid="title"]').setValue('Parent task')
    await wrapper.find('[data-testid="add-child"]').trigger('click')
    await wrapper.find('[data-testid="child-input-0"]').setValue('Sub item')
    await wrapper.find('form').trigger('submit')
    const emitted = wrapper.emitted('submit')[0][0]
    expect(emitted.children).toEqual([{ title: 'Sub item', description: '' }])
  })

  it('does not allow adding more than 10 child items', async () => {
    const wrapper = mount(TaskForm)
    for (let i = 0; i < 10; i++) {
      await wrapper.find('[data-testid="add-child"]').trigger('click')
    }
    expect(wrapper.find('[data-testid="add-child"]').attributes('disabled')).toBeDefined()
  })

  it('removes a child item when its remove button is clicked', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('[data-testid="add-child"]').trigger('click')
    await wrapper.find('[data-testid="remove-child-0"]').trigger('click')
    expect(wrapper.find('[data-testid="child-input-0"]').exists()).toBe(false)
  })
})

describe('TaskForm — child description', () => {
  it('shows a description input for each child row', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('[data-testid="add-child"]').trigger('click')
    expect(wrapper.find('[data-testid="child-description-0"]').exists()).toBe(true)
  })

  it('includes child description in the submit payload', async () => {
    const wrapper = mount(TaskForm)
    await wrapper.find('[data-testid="title"]').setValue('Parent task')
    await wrapper.find('[data-testid="add-child"]').trigger('click')
    await wrapper.find('[data-testid="child-input-0"]').setValue('Sub item')
    await wrapper.find('[data-testid="child-description-0"]').setValue('Child detail')
    await wrapper.find('form').trigger('submit')
    const emitted = wrapper.emitted('submit')[0][0]
    expect(emitted.children[0].description).toBe('Child detail')
  })
})
