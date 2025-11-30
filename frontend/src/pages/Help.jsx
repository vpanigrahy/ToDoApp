import { useState } from 'react'

export default function Help() {
  const [openSections, setOpenSections] = useState({
    priority: false,
    edd: false,
    spt: false,
    wspt: false,
    completion: false,
    overdue: false,
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Help & About</h1>

      {/* What the App Does */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">📝 What is Task Management Tool?</h2>
        <p className="text-gray-600 mb-4">
          This is a task prioritization tool designed to help you manage your tasks effectively. 
          It's especially useful for university students juggling multiple assignments, projects, and deadlines.
        </p>
        <p className="text-gray-600">
          The tool helps you organize tasks based on urgency, importance, and completion status, 
          making it easier to focus on what matters most.
        </p>
      </section>

      {/* Collapsible FAQ Sections */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">❓ Frequently Asked Questions</h2>
        
        {/* What does priority mean? */}
        <div className="border-b border-gray-200 pb-3 mb-3">
          <button
            onClick={() => toggleSection('priority')}
            className="w-full text-left flex justify-between items-center text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="font-medium">▸ What does priority mean?</span>
            <span className="text-gray-500">{openSections.priority ? '−' : '+'}</span>
          </button>
          {openSections.priority && (
            <div className="mt-3 text-gray-600 text-sm space-y-2 pl-4">
              <p><strong className="text-blue-600">P1</strong> = tasks you must do first, usually urgent.</p>
              <p><strong className="text-yellow-600">P2</strong> = important but not critical.</p>
              <p><strong className="text-green-600">P3</strong> = nice-to-do, low urgency.</p>
            </div>
          )}
        </div>

        {/* What is EDD? */}
        <div className="border-b border-gray-200 pb-3 mb-3">
          <button
            onClick={() => toggleSection('edd')}
            className="w-full text-left flex justify-between items-center text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="font-medium">▸ What is EDD (Earliest Due Date)?</span>
            <span className="text-gray-500">{openSections.edd ? '−' : '+'}</span>
          </button>
          {openSections.edd && (
            <div className="mt-3 text-gray-600 text-sm pl-4">
              <p>Tasks are sorted primarily by due date (earliest first).</p>
              <p className="mt-2">This helps you tackle time-sensitive tasks before they become overdue.</p>
            </div>
          )}
        </div>

        {/* What is SPT? */}
        <div className="border-b border-gray-200 pb-3 mb-3">
          <button
            onClick={() => toggleSection('spt')}
            className="w-full text-left flex justify-between items-center text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="font-medium">▸ What is SPT (Shortest Processing Time)?</span>
            <span className="text-gray-500">{openSections.spt ? '−' : '+'}</span>
          </button>
          {openSections.spt && (
            <div className="mt-3 text-gray-600 text-sm pl-4">
              <p>Focus on tasks that can be completed quickly.</p>
              <p className="mt-2">This strategy helps build momentum by finishing smaller tasks first, giving you a sense of accomplishment.</p>
            </div>
          )}
        </div>

        {/* What is WSPT? */}
        <div className="border-b border-gray-200 pb-3 mb-3">
          <button
            onClick={() => toggleSection('wspt')}
            className="w-full text-left flex justify-between items-center text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="font-medium">▸ What is WSPT (Weighted Shortest Processing Time)?</span>
            <span className="text-gray-500">{openSections.wspt ? '−' : '+'}</span>
          </button>
          {openSections.wspt && (
            <div className="mt-3 text-gray-600 text-sm pl-4">
              <p>Maximize value by considering both importance and estimated time.</p>
              <p className="mt-2">Formula: <code className="bg-gray-100 px-2 py-1 rounded text-yellow-700">importance ÷ estimated time</code></p>
              <p className="mt-2">This helps you work on high-value tasks efficiently.</p>
            </div>
          )}
        </div>

        {/* What does completion % mean? */}
        <div className="border-b border-gray-200 pb-3 mb-3">
          <button
            onClick={() => toggleSection('completion')}
            className="w-full text-left flex justify-between items-center text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="font-medium">▸ What does completion % mean?</span>
            <span className="text-gray-500">{openSections.completion ? '−' : '+'}</span>
          </button>
          {openSections.completion && (
            <div className="mt-3 text-gray-600 text-sm pl-4">
              <p>0% means not started, 50% half done, 100% completed.</p>
              <p className="mt-2">Use the slider to update task progress as you work on it.</p>
            </div>
          )}
        </div>

        {/* What does overdue mean? */}
        <div className="pb-3">
          <button
            onClick={() => toggleSection('overdue')}
            className="w-full text-left flex justify-between items-center text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="font-medium">▸ What does overdue mean?</span>
            <span className="text-gray-500">{openSections.overdue ? '−' : '+'}</span>
          </button>
          {openSections.overdue && (
            <div className="mt-3 text-gray-600 text-sm pl-4">
              <p>If today is after the due date and completed=false, the task is overdue.</p>
              <p className="mt-2">Overdue tasks are highlighted with a ⚠️ warning and red background.</p>
            </div>
          )}
        </div>
      </section>

      {/* Technologies Used */}
      <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">🛠️ Technologies Used</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium text-blue-600 mb-2">Frontend</h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• React 19</li>
              <li>• Vite</li>
              <li>• Tailwind CSS</li>
              <li>• Recharts (for visualizations)</li>
              <li>• React Router</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-green-600 mb-2">Backend</h3>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• Flask (Python)</li>
              <li>• PostgreSQL Database</li>
              <li>• RESTful API</li>
              <li>• Session-based Auth</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">💡 Pro Tips</h2>
        <ul className="space-y-2 text-blue-700 text-sm">
          <li>✓ Add actionable items to break down complex tasks into smaller steps</li>
          <li>✓ Use the completion percentage slider to track progress on ongoing tasks</li>
          <li>✓ Check your Analytics dashboard regularly to maintain a good on-time completion rate</li>
          <li>✓ Review your Completed Tasks history to identify patterns and improve time management</li>
          <li>✓ Set realistic due dates to avoid unnecessary stress</li>
        </ul>
      </section>
    </div>
  )
}
