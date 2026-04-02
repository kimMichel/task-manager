async function request(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}

export async function fetchTasks(date) {
  const url = date ? `/api/tasks?date=${date}` : '/api/tasks'
  const res = await request(url, { method: 'GET' })
  return res.json()
}

export async function createTask(payload) {
  const res = await request('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function updateTask(id, updates) {
  const res = await request(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return res.json()
}

export async function deleteTask(id, date) {
  const url = date ? `/api/tasks/${id}?date=${date}` : `/api/tasks/${id}`
  await request(url, { method: 'DELETE' })
}
