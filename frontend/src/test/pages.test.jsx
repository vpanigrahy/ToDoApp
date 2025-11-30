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
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    api.fetchAnalyticsSummary.mockImplementation(() => new Promise(() => {}))
    api.fetchAnalyticsCFD.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument()
  })

  it('displays analytics summary data', async () => {
    const mockSummary = {
      total_completed: 10,
      completed_on_time: 8,
      on_time_rate: 0.8,
      tasks_completed_this_week: 5,
      avg_completion_days: 3.5,
    }

    const mockCFD = [
      { date: '2025-11-20', backlog: 5, inProgress: 2, done: 3 },
      { date: '2025-11-21', backlog: 4, inProgress: 3, done: 4 },
    ]

    api.fetchAnalyticsSummary.mockResolvedValue(mockSummary)
    api.fetchAnalyticsCFD.mockResolvedValue(mockCFD)

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/On-time Completion Rate/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/80%/)).toBeInTheDocument()
    expect(screen.getByText(/Great job!/i)).toBeInTheDocument()
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
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
    })
  })

  it('renders time window filter buttons', async () => {
    api.fetchAnalyticsSummary.mockResolvedValue({
      total_completed: 5,
      on_time_rate: 0.5,
      tasks_completed_this_week: 2,
      avg_completion_days: 2.0,
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

  it('renders loading state initially', () => {
    api.fetchCompletedTasks.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('displays completed tasks', async () => {
    const mockTasks = [
      {
        id: '1',
        name: 'Task 1',
        priority: 'P1',
        dueDate: '2025-11-20',
        completedAt: '2025-11-19',
        onTime: true,
      },
      {
        id: '2',
        name: 'Task 2',
        priority: 'P2',
        dueDate: '2025-11-15',
        completedAt: '2025-11-20',
        onTime: false,
      },
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

    expect(screen.getByText(/Total: 2/)).toBeInTheDocument()
    expect(screen.getByText(/On Time: 1/)).toBeInTheDocument()
    expect(screen.getByText(/Late: 1/)).toBeInTheDocument()
  })

  it('shows empty state when no tasks', async () => {
    api.fetchCompletedTasks.mockResolvedValue([])

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/No completed tasks yet/i)).toBeInTheDocument()
    })
  })

  it('handles API errors', async () => {
    api.fetchCompletedTasks.mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
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
      expect(screen.getByText(/All/)).toBeInTheDocument()
      expect(screen.getByText(/On Time/)).toBeInTheDocument()
      expect(screen.getByText(/Late/)).toBeInTheDocument()
    })
  })
})

describe('Help Page', () => {
  it('renders page title', () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    expect(screen.getByText(/Help & About/i)).toBeInTheDocument()
  })

  it('displays app description section', () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    expect(screen.getByText(/What is Task Management Tool/i)).toBeInTheDocument()
    expect(screen.getByText(/prioritization tool/i)).toBeInTheDocument()
  })

  it('displays features section', () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    expect(screen.getByText(/Key Features/i)).toBeInTheDocument()
  })

  it('displays priority strategies section', () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    expect(screen.getByText(/Priority Strategies/i)).toBeInTheDocument()
    expect(screen.getByText(/EDD/)).toBeInTheDocument()
    expect(screen.getByText(/SPT/)).toBeInTheDocument()
    expect(screen.getByText(/WSPT/)).toBeInTheDocument()
  })

  it('displays priority levels guide', () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    expect(screen.getByText(/Priority Levels/i)).toBeInTheDocument()
    expect(screen.getByText(/P1/)).toBeInTheDocument()
    expect(screen.getByText(/P2/)).toBeInTheDocument()
    expect(screen.getByText(/P3/)).toBeInTheDocument()
  })

  it('displays technologies section', () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    expect(screen.getByText(/Technologies Used/i)).toBeInTheDocument()
    expect(screen.getByText(/React/i)).toBeInTheDocument()
    expect(screen.getByText(/Flask/i)).toBeInTheDocument()
    expect(screen.getByText(/PostgreSQL/i)).toBeInTheDocument()
  })

  it('displays pro tips section', () => {
    render(
      <BrowserRouter>
        <Help />
      </BrowserRouter>
    )

    expect(screen.getByText(/Pro Tips/i)).toBeInTheDocument()
  })
})
