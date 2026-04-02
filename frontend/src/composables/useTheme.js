import { ref } from 'vue'

export function useTheme() {
  const isDark = ref(document.documentElement.classList.contains('dark'))

  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark')
    isDark.value = true
  }

  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  return { isDark, toggle }
}
