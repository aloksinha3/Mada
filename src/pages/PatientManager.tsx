import { useEffect, useState } from 'react'
import { api, Patient, PatientCreate, Medication } from '../api/client'
import { Plus, Edit, Trash2, X, Phone, Calendar, Activity } from 'lucide-react'

interface PatientCall {
  id: number
  call_type: string
  status: string
  message_text: string
  scheduled_time: string
  completed_at: string | null
}

export default function PatientManager() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientCalls, setPatientCalls] = useState<PatientCall[]>([])
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false)
  const [formData, setFormData] = useState<PatientCreate>({
    name: '',
    phone: '',
    gestational_age_weeks: 0,
    risk_factors: [],
    medications: [],
    risk_category: 'low',
  })
  const [riskFactorsInput, setRiskFactorsInput] = useState('')
  const [medicationInputs, setMedicationInputs] = useState<Medication[]>([])
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Helper function to extract error message from various error types
  const getErrorMessage = (error: any): string => {
    if (error?.response) {
      // HTTP error response from server
      return error.response.data?.detail || 
             error.response.data?.message || 
             error.response.statusText || 
             `Server error (${error.response.status})`
    } else if (error?.message) {
      // Network error or other error with message
      return error.message
    } else if (error?.code) {
      // Error with code but no message
      return `Network error: ${error.code}`
    }
    return 'Unknown error occurred'
  }

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      loadPatientDetails(selectedPatient.id)
    }
  }, [selectedPatient])

  const loadPatients = async () => {
    try {
      const response = await api.getPatients()
      setPatients(response.data)
    } catch (error: any) {
      console.error('Error loading patients:', error)
      // Show error message for network issues
      if (!error?.response) {
        alert(`Error loading patients: ${getErrorMessage(error)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadPatientDetails = async (patientId: number) => {
    setLoadingPatientDetails(true)
    try {
      // Load patient details and upcoming calls
      const [patientResponse, callsResponse] = await Promise.all([
        api.getPatient(patientId),
        api.getUpcomingCalls(patientId)
      ])
      
      setSelectedPatient(patientResponse.data)
      setPatientCalls(callsResponse.data.calls || [])
    } catch (error: any) {
      console.error('Error loading patient details:', error)
    } finally {
      setLoadingPatientDetails(false)
    }
  }

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient)
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert risk factors input to array
      const riskFactors = riskFactorsInput.split(',').map(s => s.trim()).filter(s => s)
      
      // Filter and validate medications
      const medications = medicationInputs
        .filter(med => med.name.trim() !== '')
        .map(med => ({
          name: med.name.trim(),
          dosage: med.dosage.trim(),
          frequency: Array.isArray(med.frequency) ? med.frequency : [],
          time: med.time || ''
        }))
      
      const submitData = {
        ...formData,
        risk_factors: riskFactors,
        medications: medications,
      }
      
      if (editingPatient) {
        await api.updatePatient(editingPatient.id, submitData)
      } else {
        await api.createPatient(submitData)
      }
      setShowModal(false)
      setEditingPatient(null)
      resetForm()
      loadPatients()
    } catch (error: any) {
      console.error('Error saving patient:', error)
      alert(`Error saving patient: ${getErrorMessage(error)}`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      gestational_age_weeks: 0,
      risk_factors: [],
      medications: [],
      risk_category: 'low',
    })
    setRiskFactorsInput('')
    setMedicationInputs([{ name: '', dosage: '', frequency: [], time: '' }])
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setFormData({
      name: patient.name,
      phone: patient.phone,
      gestational_age_weeks: patient.gestational_age_weeks,
      risk_factors: patient.risk_factors,
      medications: patient.medications,
      risk_category: patient.risk_category,
    })
    setRiskFactorsInput(patient.risk_factors.join(', '))
    
    // Set medication inputs - handle old format (string frequency) and new format (array)
    if (patient.medications && patient.medications.length > 0) {
      const convertedMeds = patient.medications.map((med: any) => ({
        name: med.name || '',
        dosage: med.dosage || '',
        frequency: Array.isArray(med.frequency) ? med.frequency : (med.frequency ? [med.frequency] : []),
        time: med.time || ''
      }))
      setMedicationInputs(convertedMeds)
    } else {
      setMedicationInputs([{ name: '', dosage: '', frequency: [], time: '' }])
    }
    
    setShowModal(true)
  }

  const handleGenerateSchedule = async (patientId: number) => {
    try {
      await api.generateIVRSchedule(patientId)
      alert('IVR schedule generated successfully!')
      loadPatients()
    } catch (error: any) {
      console.error('Error generating schedule:', error)
      alert(`Error generating schedule: ${getErrorMessage(error)}`)
    }
  }

  const handleDelete = async (patientId: number, patientName: string) => {
    if (!confirm(`Are you sure you want to delete patient "${patientName}"? This will also delete all associated calls and messages. This action cannot be undone.`)) {
      return
    }
    
    try {
      await api.deletePatient(patientId)
      alert('Patient deleted successfully!')
      // Close detail card if deleted patient was selected
      if (selectedPatient && selectedPatient.id === patientId) {
        setSelectedPatient(null)
      }
      loadPatients()
    } catch (error: any) {
      console.error('Error deleting patient:', error)
      alert(`Error deleting patient: ${getErrorMessage(error)}`)
    }
  }

  const addMedication = () => {
    setMedicationInputs([...medicationInputs, { name: '', dosage: '', frequency: [], time: '' }])
  }

  const removeMedication = (index: number) => {
    setMedicationInputs(medicationInputs.filter((_, i) => i !== index))
  }

  const updateMedication = (index: number, field: keyof Medication, value: string | string[]) => {
    const updated = [...medicationInputs]
    updated[index] = { ...updated[index], [field]: value }
    setMedicationInputs(updated)
  }

  const toggleMedicationDay = (index: number, day: string) => {
    const updated = [...medicationInputs]
    const currentDays = updated[index].frequency || []
    if (currentDays.includes(day)) {
      updated[index].frequency = currentDays.filter(d => d !== day)
    } else {
      updated[index].frequency = [...currentDays, day]
    }
    setMedicationInputs(updated)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="flex gap-4">
      {/* Main Content - Patients Table */}
      <div className={`flex-1 ${selectedPatient ? 'w-2/3' : 'w-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Patient Manager</h2>
          <button
            onClick={() => {
              setShowModal(true)
              setEditingPatient(null)
              resetForm()
            }}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Patient
          </button>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gestational Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr 
                  key={patient.id}
                  onClick={() => handlePatientClick(patient)}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedPatient?.id === patient.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                  }`}
                >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {patient.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.gestational_age_weeks} weeks
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      patient.risk_category === 'high'
                        ? 'bg-red-100 text-red-800'
                        : patient.risk_category === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {patient.risk_category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {patient.medications && patient.medications.length > 0 ? (
                    <div>
                      {patient.medications.map((med, idx) => {
                        const frequency = Array.isArray(med.frequency) 
                          ? med.frequency.join(', ') 
                          : (med.frequency || '')
                        return (
                          <div key={idx} className="mb-1 text-xs">
                            <div className="font-medium">{med.name}</div>
                            {med.dosage && <div className="text-gray-600">Dosage: {med.dosage}</div>}
                            {frequency && <div className="text-gray-600">Days: {frequency}</div>}
                            {med.time && <div className="text-gray-600">Time: {med.time}</div>}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(patient)}
                    className="text-primary-600 hover:text-primary-900"
                    title="Edit Patient"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleGenerateSchedule(patient.id)}
                    className="text-green-600 hover:text-green-900 text-xs px-2 py-1"
                    title="Generate Schedule"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => handleDelete(patient.id, patient.name)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Patient"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Patient Detail Card - Right Side */}
      {selectedPatient && (
        <div className="w-1/3 bg-white rounded-lg shadow-lg p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h3>
            <button
              onClick={() => setSelectedPatient(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loadingPatientDetails ? (
            <div className="text-center py-8">Loading patient details...</div>
          ) : (
            <>
              {/* Patient Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Patient Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">{selectedPatient.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gestational Age:</span>
                    <span className="ml-2 font-medium">{selectedPatient.gestational_age_weeks} weeks</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Risk Category:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedPatient.risk_category === 'high'
                        ? 'bg-red-100 text-red-800'
                        : selectedPatient.risk_category === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedPatient.risk_category}
                    </span>
                  </div>
                  {selectedPatient.risk_factors && selectedPatient.risk_factors.length > 0 && (
                    <div>
                      <span className="text-gray-600">Risk Factors:</span>
                      <span className="ml-2">{selectedPatient.risk_factors.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications */}
              {selectedPatient.medications && selectedPatient.medications.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Medications</h4>
                  <div className="space-y-2">
                    {selectedPatient.medications.map((med, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-md text-sm">
                        <div className="font-medium">{med.name}</div>
                        {med.dosage && <div className="text-gray-600">Dosage: {med.dosage}</div>}
                        {med.frequency && med.frequency.length > 0 && (
                          <div className="text-gray-600">Days: {Array.isArray(med.frequency) ? med.frequency.join(', ') : med.frequency}</div>
                        )}
                        {med.time && <div className="text-gray-600">Time: {med.time}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Analytics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="text-xs text-gray-600">Upcoming Calls</div>
                    <div className="text-2xl font-bold text-blue-600">{patientCalls.length}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-md">
                    <div className="text-xs text-gray-600">Gestational Age</div>
                    <div className="text-2xl font-bold text-green-600">{selectedPatient.gestational_age_weeks}w</div>
                  </div>
                </div>
              </div>

              {/* Call Schedule */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Upcoming Calls
                </h4>
                {patientCalls.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No upcoming calls scheduled
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {patientCalls.map((call) => (
                      <div key={call.id} className="p-3 bg-gray-50 rounded-md text-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-blue-600">{formatCallType(call.call_type)}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(call.scheduled_time).toLocaleDateString()} {new Date(call.scheduled_time).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {call.message_text?.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    setEditingPatient(selectedPatient)
                    setFormData({
                      name: selectedPatient.name,
                      phone: selectedPatient.phone,
                      gestational_age_weeks: selectedPatient.gestational_age_weeks,
                      risk_factors: selectedPatient.risk_factors,
                      medications: selectedPatient.medications,
                      risk_category: selectedPatient.risk_category,
                    })
                    setRiskFactorsInput(selectedPatient.risk_factors.join(', '))
                    if (selectedPatient.medications && selectedPatient.medications.length > 0) {
                      setMedicationInputs(selectedPatient.medications)
                    } else {
                      setMedicationInputs([{ name: '', dosage: '', frequency: [], time: '' }])
                    }
                    setShowModal(true)
                  }}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Patient
                </button>
                <button
                  onClick={() => handleGenerateSchedule(selectedPatient.id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Generate Schedule
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingPatient ? 'Edit Patient' : 'Add New Patient'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+1234567890"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gestational Age (weeks)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="42"
                  value={formData.gestational_age_weeks}
                  onChange={(e) =>
                    setFormData({ ...formData, gestational_age_weeks: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Category
                </label>
                <select
                  value={formData.risk_category}
                  onChange={(e) => setFormData({ ...formData, risk_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Factors (comma-separated)
                </label>
                <input
                  type="text"
                  value={riskFactorsInput}
                  onChange={(e) => setRiskFactorsInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="diabetes, hypertension"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medications
                </label>
                {medicationInputs.map((med, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Medication {index + 1}</span>
                      {medicationInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Medication Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Folic Acid"
                          value={med.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          placeholder="e.g., 400mg"
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Time</label>
                        <input
                          type="time"
                          value={med.time}
                          onChange={(e) => updateMedication(index, 'time', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Days of Week</label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <label
                              key={day}
                              className="flex items-center cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={(med.frequency || []).includes(day)}
                                onChange={() => toggleMedicationDay(index, day)}
                                className="mr-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <span className="text-xs text-gray-700">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMedication}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  + Add Medication
                </button>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingPatient(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {editingPatient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
