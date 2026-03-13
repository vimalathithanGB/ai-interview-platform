import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ---------- Resume ----------

export interface ProfileData {
  name: string;
  skills: string[];
  projects: string[];
  education: string;
  experience: string;
  email?: string;
  phone?: string;
  target_role?: string;
}

export interface UploadResumeResponse {
  message: string;
  profile: ProfileData;
}

export const uploadResume = async (file: File): Promise<UploadResumeResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadResumeResponse>('/upload_resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ---------- Interview ----------

export interface InterviewConfigResponse {
  status: string;
  company: string;
  interview_type: string;
}

export const configureInterview = async (
  company: string,
  interview_type: 'technical' | 'non_technical' | 'mixed',
  mode: 'text' | 'voice' = 'text',
): Promise<InterviewConfigResponse> => {
  const { data } = await api.post<InterviewConfigResponse>('/interview/configure', {
    company,
    interview_type,
    mode,
  });
  return data;
};

export interface QuestionPayload {
  topic: string;
  question: string;
  question_number: number;
  question_type: 'primary' | 'followup';
  effective_type?: string;
  audio_url?: string;
}

export const startInterview = async (
  profile: { name: string; skills: string[]; target_role: string },
  resume: { projects: string[]; education: string; experience: string },
): Promise<QuestionPayload> => {
  const { data } = await api.post<QuestionPayload>('/interview/start', { profile, resume });
  return data;
};

export interface AnalysisResult {
  understanding: 'low' | 'partial' | 'good';
  confidence: 'low' | 'medium' | 'high';
  followup_needed: boolean;
  error?: string;
}

export interface AnswerResponse {
  status: 'followup_required' | 'next_topic' | 'error';
  analysis?: AnalysisResult;
  next_question?: QuestionPayload;
  message?: string;
}

export const submitAnswer = async (answer: string): Promise<AnswerResponse> => {
  const { data } = await api.post<AnswerResponse>('/interview/answer', null, {
    params: { answer },
  });
  return data;
};

// ---------- Results ----------

export interface InterviewReport {
  candidate_name: string;
  role: string;
  total_questions: number;
  answered_questions: number;
  average_score: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'Reject';
  strengths: string[];
  weaknesses: string[];
  topics_covered: string[];
  report_url?: string;
}

export const endInterview = async (userEmail = ''): Promise<InterviewReport> => {
  const { data } = await api.post<InterviewReport>('/interview/end', null, {
    params: { user_email: userEmail },
  });
  return data;
};

// ---------- History ----------

export interface InterviewHistoryEntry {
  id: number;
  candidate_name: string;
  date_taken: string; // ISO string
  duration_seconds: number;
  total_questions: number;
  answered_questions: number;
  average_score: number;
  recommendation: string;
  strengths: string[];
  improvements: string[];
  topics_covered: string[];
  interview_type: string;
  company: string;
}

export const getInterviewHistory = async (email: string): Promise<InterviewHistoryEntry[]> => {
  const { data } = await api.get<InterviewHistoryEntry[]>('/interview/history', {
    params: { email },
  });
  return data;
};

export const clearInterviewHistory = async (email: string): Promise<void> => {
  await api.delete('/interview/history', { params: { email } });
};

export default api;
