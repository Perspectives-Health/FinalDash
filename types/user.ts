export interface SessionDetail {
  patient_name: string
  created_at: string
  session_type: string
  session_status: string
  workflow_status: string
  session_id: string
  workflow_id: string
  workflow_name: string
  patient_id: string
  json_to_populate: any
  diarized_transcription: any
  audio_link: string | null
}

export interface WorkflowInstance {
  workflow_id: string
  workflow_name: string
  workflow_status: string
  json_to_populate: any
}

export interface GroupedSession {
  session_id: string
  patient_name: string
  patient_id: string
  created_at: string
  session_type: string
  session_status: string
  audio_link: string | null
  diarized_transcription: any
  workflows: WorkflowInstance[]
}
