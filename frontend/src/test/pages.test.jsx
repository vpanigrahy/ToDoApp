import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import History from '../pages/History'
import Help from '../pages/Help'
import * as api from '../api'

// Mock API module
vi.mock('../api', () => ({
  fetchAnalyticsSummary: vi.fn(),
  fetchAnalyticsCFD: vi.fn(),
  fetchCompletedTasks: vi.fn(),
  // Extra mocks for new Dashboard code
  fetchAnalyticsStreak: vi.fn(() =>
    Promise.resolve({ on_time_streak_days: 0 })
  ),
  getCurrentUser: vi.fn(() =>
    Promise.resolve({ username: 'User' })
  ),
  logout: vi.fn(() => Promise.resolve())
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    api.fetchAnalyticsSummary.mockImplementation(
      () => new Promise(() => {})
    )
    api.fetchAnalyticsCFD.mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Let effects run inside act via waitFor
    await waitFor(() => {
      expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument()
    })
  })

  it('displays analytics summary data', async () => {
    const mockSummary = {
      total_completed: 10,
      completed_on_time: 8,
      on_time_rate: 0.8,
      tasks_completed_this_week: 5,
      avg_completion_days: 3.5
    }

    const mockCFD = [
      { date: '2025-11-20', backlog: 5, in_progress: 2, done: 3 },
      { date: '2025-11-21', backlog: 4, in_progress: 3, done: 4 }
    ]

    api.fetchAnalyticsSummary.mockResolvedValue(mockSummary)
    api.fetchAnalyticsCFD.mockResolvedValue(mockCFD)
    api.fetchAnalyticsStreak.mockResolvedValue({ on_time_streak_days: 2 })
    api.getCurrentUser.mockResolvedValue({ username: 'Test User' })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Use heading role so we only match the card title, not the badge text
    const heading = await screen.findByRole('heading', {
      name: /On-Time Completion/i
    })
    expect(heading).toBeInTheDocument()

    // 80% on-time rate
    expect(screen.getByText('80%')).toBeInTheDocument()

    // High performer badge text
    expect(
      screen.getByText(/High Performer!/i)
    ).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    api.fetchAnalyticsSummary.mockRejectedValue(new Error('API Error'))
    api.fetchAnalyticsCFD.mockRejectedValue(new Error('API Error'))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Banner displays the actual error message (err.message)
      expect(screen.getByText(/API Error/i)).toBeInTheDocument()
    })
  })

  it('renders time window filter buttons', async () => {
    api.fetchAnalyticsSummary.mockResolvedValue({
      total_completed: 5,
      completed_on_time: 3,
      on_time_rate: 0.6,
      tasks_completed_this_week: 2,
      avg_completion_days: 2.0
    })
    api.fetchAnalyticsCFD.mockResolvedValue([])

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Last 7 days/i)).toBeInTheDocument()
      expect(screen.getByText(/Last 30 days/i)).toBeInTheDocument()
    })
  })
})

describe('History Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    api.fetchCompletedTasks.mockImplementation(
      () => new Promise(() => {})
    )

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    })
  })

  it('displays completed tasks', async () => {
    const mockTasks = [
      {
        id: '1',
        name: 'Task 1',
        priority: 'P1',
        dueDate: '2025-11-20',
        completedAt: '2025-11-18',
        onTime: true
      },
      {
        id: '2',
        name: 'Task 2',
        priority: 'P2',
        dueDate: '2025-11-15',
        completedAt: '2025-11-19',
        onTime: false
      }
    ]

    api.fetchCompletedTasks.mockResolvedValue(mockTasks)

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
    })

    // Matches the current UI counters:
    expect(screen.getByText(/All \(2\)/)).toBeInTheDocument()
    expect(screen.getByText(/On Time \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Late \(1\)/)).toBeInTheDocument()
  })

  it('shows empty state when no tasks', async () => {
    api.fetchCompletedTasks.mockResolvedValue([])

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/No completed tasks found/i)
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Complete some tasks to see them here!/i)
    ).toBeInTheDocument()
  })

  it('handles API errors', async () => {
    api.fetchCompletedTasks.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  it('renders filter buttons', async () => {
    api.fetchCompletedTasks.mockResolvedValue([])

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/All \(0\)/)).toBeInTheDocument()
      expect(screen.getByText(/On Time \(0\)/)).toBeInTheDocument()
      expect(screen.getByText(/Late \(0\)/)).toBeInTheDocument()
    })
  })
})

describe('Help Page', () => {
  it('renders page title', async () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Help & About/i)).toBeInTheDocument()
    })
  })

  it('displays app description section', async () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/What is Task Management Tool/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/prioritization tool/i)
      ).toBeInTheDocument()
    })
  })

  it('displays FAQ section', async () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Frequently Asked Questions/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/What does priority mean\?/i)
      ).toBeInTheDocument()
    })
  })

  it('displays priority strategy FAQ items (EDD, SPT, WSPT)', async () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/What is EDD \(Earliest Due Date\)\?/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/What is SPT \(Shortest Processing Time\)\?/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/What is WSPT \(Weighted Shortest Processing Time\)\?/i)
      ).toBeInTheDocument()
    })
  })

  it('displays priority/completion/overdue FAQ items', async () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/What does completion % mean\?/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/What does overdue mean\?/i)
      ).toBeInTheDocument()
    })
  })

  it('displays technologies section', async () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Technologies Used/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/React 19/i)).toBeInTheDocument()
      expect(screen.getByText(/Flask \(Python\)/i)).toBeInTheDocument()
      expect(screen.getByText(/PostgreSQL Database/i)).toBeInTheDocument()
    })
  })

  it('displays pro tips section', async () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Pro Tips/i)).toBeInTheDocument()
    })
  })
})
