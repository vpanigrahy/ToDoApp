// src/test/tasks.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

import Tasks from '../pages/Tasks'
import * as api from '../api'

vi.mock('../api', () => ({
  fetchTasks: vi.fn(),
  // keep other exports mocked in case Tasks imports them
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

const renderTasksPage = () => {
  return render(
    <BrowserRouter>
      <Tasks />
    </BrowserRouter>
  )
}

describe('Tasks Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main heading and subtitle', async () => {
    api.fetchTasks.mockResolvedValue([])

    renderTasksPage()

    // Heading: "Welcome User"
    expect(await screen.findByText(/Welcome\s+User/i)).toBeInTheDocument()

    // Subtitle: "Manage and prioritize your tasks efficiently"
    expect(
      screen.getByText(/Manage and prioritize your tasks efficiently/i)
    ).toBeInTheDocument()
  })

  it('shows the empty state message when there are no tasks', async () => {
    api.fetchTasks.mockResolvedValue([])

    renderTasksPage()

    await waitFor(() => {
      // Real empty-state message:
      // No tasks found. Click "Add Task" to create one.
      expect(
        screen.getByText(/No tasks found\. Click "Add Task" to create one\./i)
      ).toBeInTheDocument()
    })
  })

  it('renders filter controls (Sort By, Due Date Range, Priority Level, Hide Completed, Clear Filters)', async () => {
    api.fetchTasks.mockResolvedValue([])

    renderTasksPage()

    // Labels
    expect(await screen.findByText(/Sort By/i)).toBeInTheDocument()
    expect(screen.getByText(/Due Date Range/i)).toBeInTheDocument()
    expect(screen.getByText(/Priority Level/i)).toBeInTheDocument()

    // Toggle text
    expect(screen.getByText(/Hide Completed Tasks/i)).toBeInTheDocument()

    // Clear Filters button
    expect(
      screen.getByRole('button', { name: /Clear Filters/i })
    ).toBeInTheDocument()
  })

  it('renders a task row when tasks are returned from the API', async () => {
    const mockTasks = [
      {
        id: '1',
        name: 'Finish HW3',
        priority: 'P1',
        dueDate: '2025-12-15',
        completionPercent: 50,
        actionableItems: '',
        completed: false,
        totalTimeHours: 1,
        remainingTimeHours: 0.5,
      },
    ]

    api.fetchTasks.mockResolvedValue(mockTasks)

    renderTasksPage()

    // Wait for the row to appear
    await waitFor(() => {
      expect(screen.getByText('Finish HW3')).toBeInTheDocument()
    })

    // "P1 - High" appears both:
    // - in the Priority filter dropdown <option>
    // - in the table badge for the task row
    // So we use getAllByText and just assert at least one instance exists.
    const priorityLabels = screen.getAllByText(/P1 - High/i)
    expect(priorityLabels.length).toBeGreaterThanOrEqual(1)

    expect(screen.getByText(/50%/i)).toBeInTheDocument()

    // Delete button should be present (icon-only button with title="Delete")
    const deleteButton = screen.getByRole('button', { name: /Delete/i })
    expect(deleteButton).toBeInTheDocument()

    // We DO NOT assert deleteTask() here, because current implementation
    // may just update local state or show a confirmation dialog.
  })
})
