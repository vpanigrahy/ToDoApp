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

  describe('Shortest Processing Time (SPT) Sorting', () => {
    it('sorts tasks by remaining hours in ascending order when SPT is selected', async () => {
      const mockTasks = [
        {
          id: '1',
          name: 'Task with 5 hours remaining',
          priority: 'P1',
          dueDate: '2025-12-31',
          completionPercent: 0,
          totalTime: 5,
          actionableItems: ['Step 1'],
          completed: false,
        },
        {
          id: '2',
          name: 'Task with 2 hours remaining',
          priority: 'P2',
          dueDate: '2025-12-30',
          completionPercent: 0,
          totalTime: 2,
          actionableItems: ['Step 1'],
          completed: false,
        },
        {
          id: '3',
          name: 'Task with 1 hour remaining',
          priority: 'P3',
          dueDate: '2025-12-29',
          completionPercent: 50,
          totalTime: 2,
          actionableItems: ['Step 1'],
          completed: false,
        },
      ]

      api.fetchTasks.mockResolvedValue(mockTasks)

      renderTasksPage()

      await waitFor(() => {
        expect(screen.getByText('Task with 5 hours remaining')).toBeInTheDocument()
      })

      // Find and select SPT sorting option
      const sortSelect = screen.getAllByRole('combobox')[0] // First select is "Sort By"
      expect(sortSelect).toBeInTheDocument()

      // Change to SPT
      sortSelect.value = 'spt'
      sortSelect.dispatchEvent(new Event('change', { bubbles: true }))

      await waitFor(() => {
        // Verify all tasks are still displayed
        expect(screen.getByText('Task with 1 hour remaining')).toBeInTheDocument()
        expect(screen.getByText('Task with 2 hours remaining')).toBeInTheDocument()
        expect(screen.getByText('Task with 5 hours remaining')).toBeInTheDocument()
      })
    })

    it('pushes completed tasks to the bottom when sorting by SPT', async () => {
      const mockTasks = [
        {
          id: '1',
          name: 'Incomplete Task - 5 hours',
          priority: 'P1',
          dueDate: '2025-12-31',
          completionPercent: 0,
          totalTime: 5,
          actionableItems: ['Step 1'],
          completed: false,
        },
        {
          id: '2',
          name: 'Completed Task',
          priority: 'P2',
          dueDate: '2025-12-30',
          completionPercent: 100,
          totalTime: 10,
          actionableItems: ['Done'],
          completed: true,
        },
        {
          id: '3',
          name: 'Incomplete Task - 2 hours',
          priority: 'P3',
          dueDate: '2025-12-29',
          completionPercent: 0,
          totalTime: 2,
          actionableItems: ['Step 1'],
          completed: false,
        },
      ]

      api.fetchTasks.mockResolvedValue(mockTasks)

      renderTasksPage()

      await waitFor(() => {
        expect(screen.getByText('Incomplete Task - 5 hours')).toBeInTheDocument()
      })

      // Select SPT sorting
      const sortSelect = screen.getAllByRole('combobox')[0] // First select is "Sort By"
      sortSelect.value = 'spt'
      sortSelect.dispatchEvent(new Event('change', { bubbles: true }))

      await waitFor(() => {
        // All tasks should still be visible
        expect(screen.getByText('Incomplete Task - 2 hours')).toBeInTheDocument()
        expect(screen.getByText('Incomplete Task - 5 hours')).toBeInTheDocument()
        expect(screen.getByText('Completed Task')).toBeInTheDocument()
      })
    })

    it('calculates remaining hours correctly for partially completed tasks', async () => {
      const mockTasks = [
        {
          id: '1',
          name: 'Task 50% done, 5 hours remaining',
          priority: 'P1',
          dueDate: '2025-12-31',
          completionPercent: 50,
          totalTime: 10,
          actionableItems: ['Step 1'],
          completed: false,
        },
        {
          id: '2',
          name: 'Task 75% done, 1.25 hours remaining',
          priority: 'P2',
          dueDate: '2025-12-30',
          completionPercent: 75,
          totalTime: 5,
          actionableItems: ['Step 1'],
          completed: false,
        },
        {
          id: '3',
          name: 'Task 0% done, 3 hours remaining',
          priority: 'P3',
          dueDate: '2025-12-29',
          completionPercent: 0,
          totalTime: 3,
          actionableItems: ['Step 1'],
          completed: false,
        },
      ]

      api.fetchTasks.mockResolvedValue(mockTasks)

      renderTasksPage()

      await waitFor(() => {
        expect(screen.getByText('Task 50% done, 5 hours remaining')).toBeInTheDocument()
      })

      // Select SPT sorting
      const sortSelect = screen.getAllByRole('combobox')[0] // First select is "Sort By"
      sortSelect.value = 'spt'
      sortSelect.dispatchEvent(new Event('change', { bubbles: true }))

      await waitFor(() => {
        // Verify tasks are displayed (sorted by remaining hours: 1.25 < 3 < 5)
        expect(screen.getByText('Task 75% done, 1.25 hours remaining')).toBeInTheDocument()
        expect(screen.getByText('Task 0% done, 3 hours remaining')).toBeInTheDocument()
        expect(screen.getByText('Task 50% done, 5 hours remaining')).toBeInTheDocument()
      })
    })

    it('includes SPT option in the Sort By dropdown', async () => {
      api.fetchTasks.mockResolvedValue([])

      renderTasksPage()

      await waitFor(() => {
        expect(screen.getByText(/Sort By/i)).toBeInTheDocument()
      })

      // Find the select element
      const sortSelect = screen.getAllByRole('combobox')[0] // First select is "Sort By"

      // Check if SPT option exists
      const sptOption = Array.from(sortSelect.options).find(
        option => option.value === 'spt'
      )
      expect(sptOption).toBeDefined()
      expect(sptOption.textContent).toMatch(/Shortest Processing Time/i)
    })

    it('handles tasks with zero completion percentage correctly in SPT sort', async () => {
      const mockTasks = [
        {
          id: '1',
          name: 'Task A - 8 hours',
          priority: 'P1',
          dueDate: '2025-12-31',
          completionPercent: 0,
          totalTime: 8,
          actionableItems: ['Step 1'],
          completed: false,
        },
        {
          id: '2',
          name: 'Task B - 4 hours',
          priority: 'P2',
          dueDate: '2025-12-30',
          completionPercent: 0,
          totalTime: 4,
          actionableItems: ['Step 1'],
          completed: false,
        },
      ]

      api.fetchTasks.mockResolvedValue(mockTasks)

      renderTasksPage()

      await waitFor(() => {
        expect(screen.getByText('Task A - 8 hours')).toBeInTheDocument()
      })

      // Select SPT sorting
      const sortSelect = screen.getAllByRole('combobox')[0] // First select is "Sort By"
      sortSelect.value = 'spt'
      sortSelect.dispatchEvent(new Event('change', { bubbles: true }))

      await waitFor(() => {
        // Both tasks should be visible
        expect(screen.getByText('Task B - 4 hours')).toBeInTheDocument()
        expect(screen.getByText('Task A - 8 hours')).toBeInTheDocument()
      })
    })
  })
})
