import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ProfileData,
  QuestionPayload,
  AnalysisResult,
  InterviewReport,
  InterviewHistoryEntry,
} from '../services/api';

interface AnswerEntry {
  question: QuestionPayload;
  answer: string;
  analysis: AnalysisResult;
}

interface InterviewState {
  // Resume
  profile: ProfileData | null;
  uploadLoading: boolean;

  // Interview config
  company: string;
  interviewType: 'technical' | 'non_technical' | 'mixed';
  targetRole: string;

  // Session
  currentQuestion: QuestionPayload | null;
  answerHistory: AnswerEntry[];
  isSubmitting: boolean;
  totalQuestions: number;

  // Results
  report: InterviewReport | null;

  // Self-tracking history (all past sessions for this user)
  history: InterviewHistoryEntry[];
  historyLoaded: boolean;
}

const initialState: InterviewState = {
  profile: null,
  uploadLoading: false,
  company: '',
  interviewType: 'mixed',
  targetRole: '',
  currentQuestion: null,
  answerHistory: [],
  isSubmitting: false,
  totalQuestions: 10,
  report: null,
  history: [],
  historyLoaded: false,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<ProfileData>) {
      state.profile = action.payload;
    },
    setUploadLoading(state, action: PayloadAction<boolean>) {
      state.uploadLoading = action.payload;
    },
    setCompany(state, action: PayloadAction<string>) {
      state.company = action.payload;
    },
    setInterviewType(state, action: PayloadAction<'technical' | 'non_technical' | 'mixed'>) {
      state.interviewType = action.payload;
    },
    setTargetRole(state, action: PayloadAction<string>) {
      state.targetRole = action.payload;
    },
    setCurrentQuestion(state, action: PayloadAction<QuestionPayload>) {
      state.currentQuestion = action.payload;
    },
    addAnswerEntry(state, action: PayloadAction<AnswerEntry>) {
      state.answerHistory.push(action.payload);
    },
    setIsSubmitting(state, action: PayloadAction<boolean>) {
      state.isSubmitting = action.payload;
    },
    setReport(state, action: PayloadAction<InterviewReport>) {
      state.report = action.payload;
    },
    // History actions
    setHistory(state, action: PayloadAction<InterviewHistoryEntry[]>) {
      state.history = action.payload;
      state.historyLoaded = true;
    },
    appendHistory(state, action: PayloadAction<InterviewHistoryEntry>) {
      // Prepend so newest is always first
      state.history = [action.payload, ...state.history];
    },
    clearHistory(state) {
      state.history = [];
    },
    resetInterview(state) {
      state.currentQuestion = null;
      state.answerHistory = [];
      state.isSubmitting = false;
      state.report = null;
    },
    resetAll() {
      return initialState;
    },
  },
});

export const {
  setProfile,
  setUploadLoading,
  setCompany,
  setInterviewType,
  setTargetRole,
  setCurrentQuestion,
  addAnswerEntry,
  setIsSubmitting,
  setReport,
  setHistory,
  appendHistory,
  clearHistory,
  resetInterview,
  resetAll,
} = interviewSlice.actions;

export default interviewSlice.reducer;
