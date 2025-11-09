import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Phone, Clock, CheckCircle, X } from 'lucide-react'

interface Call {
  id: number
  patient_id: number
  call_type: string
  status: string
  message_text: string
  scheduled_time: string
  completed_at: string | null
  name: string
  phone: string
}

// Format call type for display
const formatCallType = (callType: string): string => {
  const formatMap: { [key: string]: string } = {
    'weekly_checkin': 'Weekly Check In',
    'medication_reminder': 'Medication Reminder',
    'test_call': 'Test Call',
    'high_risk_monitoring': 'High Risk Monitoring',
    'appointment_notification': 'Appointment Notification'
  }
  return formatMap[callType] || callType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

export default function CallQueue() {
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadCalls()
    // Refresh every 2 seconds for real-time updates
    const interval = setInterval(() => {
      loadCalls()
      setLastUpdate(new Date())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadCalls = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await api.getUpcomingCalls()
      const newCalls = response.data.calls || []
      setCalls(newCalls)
      setLoading(false)
    } catch (error) {
      console.error('Error loading calls:', error)
      setLoading(false)
    }
  }

  const handleCancelCall = async (callId: number, patientName: string) => {
    if (!confirm(`Are you sure you want to cancel this call for ${patientName}?`)) {
      return
    }
    
    try {
      await api.cancelCall(callId)
      alert('Call cancelled successfully!')
      loadCalls() // Refresh the list
    } catch (error: any) {
      console.error('Error cancelling call:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred'
      alert(`Error cancelling call: ${errorMessage}`)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Call Queue</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
          <p className="text-xs text-blue-600 mt-1 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Calls are executed automatically at their scheduled time
          </p>
        </div>
        <button
          onClick={() => {
            loadCalls()
            setLastUpdate(new Date())
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Call Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {calls.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No upcoming calls scheduled
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr key={call.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{call.name}</div>
                    <div className="text-sm text-gray-500">{call.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {formatCallType(call.call_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(call.scheduled_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        call.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : call.status === 'scheduled'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {call.message_text?.substring(0, 100)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {call.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancelCall(call.id, call.name)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                        title="Cancel call"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

