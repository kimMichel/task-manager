import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DaySelector from './DaySelector.vue'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

describe('DaySelector', () => {
  it('renders Today and Yesterday buttons', () => {
    const wrapper = mount(DaySelector, { props: { modelValue: today() } })
    expect(wrapper.text()).toContain('Today')
    expect(wrapper.text()).toContain('Yesterday')
  })

  it('marks Today button as active when today is selected', () => {
    const wrapper = mount(DaySelector, { props: { modelValue: today() } })
    const buttons = wrapper.findAll('button')
    const todayBtn = buttons.find(b => b.text() === 'Today')
    expect(todayBtn.classes()).toContain('active')
  })

  it('marks Yesterday button as active when yesterday is selected', () => {
    const wrapper = mount(DaySelector, { props: { modelValue: yesterday() } })
    const buttons = wrapper.findAll('button')
    const yestBtn = buttons.find(b => b.text() === 'Yesterday')
    expect(yestBtn.classes()).toContain('active')
  })

  it('emits update:modelValue with today date when Today is clicked', async () => {
    const wrapper = mount(DaySelector, { props: { modelValue: yesterday() } })
    const buttons = wrapper.findAll('button')
    await buttons.find(b => b.text() === 'Today').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([today()])
  })

  it('emits update:modelValue with yesterday date when Yesterday is clicked', async () => {
    const wrapper = mount(DaySelector, { props: { modelValue: today() } })
    const buttons = wrapper.findAll('button')
    await buttons.find(b => b.text() === 'Yesterday').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([yesterday()])
  })
})
