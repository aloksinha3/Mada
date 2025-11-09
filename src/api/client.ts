import axios, { AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = `Request timeout: The server at ${API_BASE_URL} did not respond in time. Please check if the backend server is running.`
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        error.message = `Network error: Cannot connect to ${API_BASE_URL}. Please ensure the backend server is running and accessible.`
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        error.message = `Cannot connect to backend server at ${API_BASE_URL}. Please check if the server is running.`
      }
    }
    return Promise.reject(error)
  }
)

export interface Medication {
  name: string
  dosage: string
  frequency: string[] // Array of days: ["Sun", "Mon", "Tue", etc.]
  time: string // Time in HH:MM format (24-hour)
}

export interface Patient {
  id: number
  name: string
  phone: string
  gestational_age_weeks: number
  risk_factors: string[]
  medications: Medication[]
  risk_category: string
  call_schedule?: any[]
  created_at: string
  updated_at: string
}

export interface PatientCreate {
  name: string
  phone: string
  gestational_age_weeks: number
  risk_factors: string[]
  medications: Medication[]
  risk_category: string
}

export const api = {
  // Patients
  getPatients: () => apiClient.get<Patient[]>('/patients/'),
  getPatient: (id: number) => apiClient.get<Patient>(`/patients/${id}`),
  createPatient: (data: PatientCreate) => apiClient.post('/patients/', data),
  updatePatient: (id: number, data: Partial<PatientCreate>) =>
    apiClient.put(`/patients/${id}`, data),
  deletePatient: (id: number) => apiClient.delete(`/patients/${id}`),
  
  // IVR Schedule
  generateIVRSchedule: (patientId: number) =>
    apiClient.post('/generate_comprehensive_ivr_schedule', { patient_id: patientId }),
  getUpcomingCalls: (patientId?: number) => apiClient.get('/upcoming-calls-summary', {
    params: { 
      _t: Date.now(), // Add timestamp to prevent caching
      ...(patientId && { patient_id: patientId })
    }
  }),
  
  // Analytics
  getAnalytics: () => apiClient.get('/analytics/dashboard'),
  
  // Calls
  executeCall: (callId: number) => apiClient.post(`/calls/${callId}/execute`),
  cancelCall: (callId: number) => apiClient.delete(`/calls/${callId}`),
}

export default apiClient

