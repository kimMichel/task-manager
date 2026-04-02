import { defineStore } from 'pinia'
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/tasks.js'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
  }),

  getters: {
    sortedTasks: (state) => {
      const order = { high: 0, medium: 1, low: 2 }
      return [...state.tasks].sort((a, b) => order[a.urgency] - order[b.urgency])
    },
  },

  actions: {
    async loadTasks(date) {
      this.loading = true
      this.error = null
      try {
        this.tasks = await fetchTasks(date)
      } catch (e) {
        this.error = e.message
        this.tasks = []
      } finally {
        this.loading = false
      }
    },

    async addTask(payload) {
      this.error = null
      try {
        const task = await createTask(payload)
        this.tasks.push(task)
      } catch (e) {
        this.error = e.message
      }
    },

    async editTask(id, updates) {
      this.error = null
      try {
        const updated = await updateTask(id, updates)
        const index = this.tasks.findIndex(t => t.id === id)
        if (index !== -1) this.tasks[index] = updated
      } catch (e) {
        this.error = e.message
      }
    },

    async removeTask(id, date) {
      this.error = null
      try {
        await deleteTask(id, date)
        this.tasks = this.tasks.filter(t => t.id !== id)
      } catch (e) {
        this.error = e.message
      }
    },
  },
})
