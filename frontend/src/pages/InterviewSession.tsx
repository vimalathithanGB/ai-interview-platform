import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Send,
  Brain,
  Gauge,
  TrendingUp,
  AlertTriangle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  User,
  Phone,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addAnswerEntry, setCurrentQuestion, setIsSubmitting, setReport, appendHistory } from '../store/interviewSlice';
import { submitAnswer, endInterview } from '../services/api';

export default function InterviewSession() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentQuestion, answerHistory, isSubmitting, profile } = useAppSelector((s) => s.interview);
  const user = useAppSelector((s) => s.auth.user);

  const [answer, setAnswer] = useState('');
  const [lastAnalysis, setLastAnalysis] = useState<{
    understanding: string;
    confidence: string;
    followup_needed: boolean;
  } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [ending, setEnding] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Webcam States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamError, setStreamError] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);

  // Toggle video tracks on/off
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = videoEnabled;
      });
    }
  }, [videoEnabled]);

  // Initialize Webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setStreamError(true);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setAnswer((prev) => (prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim()));
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'no-speech') {
           setIsRecording(false);
        }
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        toast.error('Speech recognition is not supported in this browser.');
      }
    }
  };

  // Play audio when a new question with audio_url arrives
  useEffect(() => {
    if (currentQuestion?.audio_url) {
      const audioUrl = `http://localhost:8000${currentQuestion.audio_url}`;
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.warn('Audio playback blocked by browser:', err);
      });
    }
  }, [currentQuestion]);

  // Redirect if no question loaded
  useEffect(() => {
    if (!currentQuestion && answerHistory.length === 0) {
      navigate('/');
    }
  }, [currentQuestion, answerHistory.length, navigate]);

  // ---- Submit answer ----
  const handleSubmit = async () => {
    if (!answer.trim() || !currentQuestion) return;

    dispatch(setIsSubmitting(true));
    setShowFeedback(false);

    try {
      const res = await submitAnswer(answer.trim());

      if (res.status === 'error') {
        toast.error(res.message ?? 'Error submitting answer');
        dispatch(setIsSubmitting(false));
        return;
      }

      if (res.analysis) {
        dispatch(
          addAnswerEntry({
            question: currentQuestion,
            answer: answer.trim(),
            analysis: res.analysis,
          }),
        );

        setLastAnalysis(res.analysis);
        setShowFeedback(true);
      }

      // After showing feedback briefly, load next question
      setTimeout(() => {
        setShowFeedback(false);
        if (res.next_question) {
          dispatch(setCurrentQuestion(res.next_question));
        }
        setAnswer('');
        dispatch(setIsSubmitting(false));
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg);
      dispatch(setIsSubmitting(false));
    }
  };

  // ---- End interview ----
  const handleEnd = async () => {
    setEnding(true);
    try {
      const report = await endInterview(user?.email ?? '');
      dispatch(setReport(report));
      // Append a lightweight summary to the in-memory history
      dispatch(appendHistory({
        id: Date.now(),
        candidate_name: report.candidate_name,
        date_taken: new Date().toISOString(),
        duration_seconds: 0,
        total_questions: report.total_questions,
        answered_questions: report.answered_questions,
        average_score: report.average_score,
        recommendation: report.recommendation,
        strengths: report.strengths,
        improvements: report.weaknesses,
        topics_covered: report.topics_covered,
        interview_type: 'mixed',
        company: '',
      }));
      navigate('/results');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end interview';
      toast.error(msg);
    } finally {
      setEnding(false);
    }
  };

  // ---- Understanding helpers ----
  const understandingConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    good: { color: 'text-cyan-400', icon: TrendingUp, label: 'Good Understanding' },
    partial: { color: 'text-yellow-400', icon: Gauge, label: 'Partial Understanding' },
    low: { color: 'text-red-400', icon: AlertTriangle, label: 'Needs Improvement' },
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="spinner mx-auto" />
          <p className="text-surface-200/60 text-sm">Loading interview…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto py-4 px-4 h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-white">Interview Session</h2>
          {profile?.name && <p className="text-sm text-indigo-200/50 mt-1">Candidate: <span className="text-indigo-200/80 font-medium">{profile.name}</span></p>}
        </div>
        <div className="flex items-center gap-3 bg-[#110A2B]/80 backdrop-blur-xl border border-indigo-500/30 rounded-full px-4 py-2 shadow-lg">
           <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
           <span className="text-xs font-semibold tracking-widest text-indigo-200 uppercase">AI Interrogator Active</span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Video Feed & Controls */}
        <div className="flex flex-col gap-4 h-full">
          {/* Video Container */}
          <div className="flex-1 relative rounded-3xl overflow-hidden bg-[#0A051E] border border-white/10 shadow-2xl flex items-center justify-center min-h-[300px]">
            {!streamError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${videoEnabled ? 'opacity-100' : 'opacity-0'}`}
              />
            ) : null}

            {!videoEnabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#110A2B]">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/30 border border-white/10 mb-4">
                  <User size={48} />
                </div>
                <p className="text-white/50 font-medium text-sm">Camera is off</p>
              </div>
            )}

            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="h-16 shrink-0 bg-[#16122d] border border-white/10 rounded-2xl flex items-center justify-center gap-4 px-6 shadow-xl">
             <button 
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!videoEnabled ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-600' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Toggle Camera"
              >
                {!videoEnabled ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              <button
                onClick={toggleRecording}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isRecording ? 'Stop Recording' : 'Start Microphone'}
              >
                {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <div className="w-px h-8 bg-white/10 mx-2" />

              <button
                onClick={handleEnd}
                disabled={ending}
                className="h-12 px-6 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                {ending ? <div className="spinner !w-4 !h-4 !border-2" /> : <Phone size={18} style={{ transform: 'rotate(135deg)' }} />}
                End Call
              </button>
          </div>
        </div>

        {/* Right Column: Q&A */}
        <div className="flex flex-col gap-4 h-full">

          {/* Question Overlay Card */}
          <div className="shrink-0 bg-[#110A2B]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
            <div className="flex items-start gap-4 pl-3">
              <div className="mt-1 w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0 border border-cyan-500/20">
                <Brain size={24} className="text-cyan-400" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
                    {currentQuestion.question_type === 'followup' ? 'Follow-up' : 'Question'} #{currentQuestion.question_number}
                  </span>
                  {currentQuestion.topic && (
                    <span className="px-2.5 py-1 rounded text-[10px] bg-white/5 text-indigo-200/60 font-semibold border border-white/5 uppercase tracking-wider">
                      {currentQuestion.topic}
                    </span>
                  )}
                </div>
                <p className="text-lg text-white/95 leading-relaxed font-medium">{currentQuestion.question}</p>
              </div>
            </div>
          </div>

          {/* Answer Box */}
          <div className="flex-1 bg-[#16122d]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col relative focus-within:border-indigo-500/50 transition-colors">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-300/60 mb-4">
              <Mic size={14} className="text-indigo-400" /> Your Answer
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isSubmitting}
              placeholder="Type your answer, or click the mic button below the video to speak..."
              className="flex-1 w-full bg-transparent text-lg text-white placeholder-white/20 resize-none outline-none leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
              }}
            />
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-indigo-200/40 font-medium tracking-wide">Ctrl+Enter to submit</span>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !answer.trim()}
                className="h-12 px-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-white font-medium flex items-center gap-2 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                {isSubmitting ? <div className="spinner !w-4 !h-4 !border-2" /> : <>Submit Answer</>}
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Overlay Center */}
      {showFeedback && lastAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05030e]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#110A2B]/95 border border-indigo-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(99,102,241,0.5)] flex flex-col items-center max-w-sm w-full relative overflow-hidden transform scale-100">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            {(() => {
              const cfg = understandingConfig[lastAnalysis.understanding] ?? understandingConfig.partial;
              const Icon = cfg.icon;
              return (
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-black/40 border border-white/10 ${cfg.color} shadow-inner`}>
                     <Icon size={40} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 tracking-wide ${cfg.color}`}>{cfg.label}</h3>
                  <p className="text-indigo-200/70 text-center text-sm font-medium mt-2">
                    Confidence: <span className="text-white tracking-wider">{lastAnalysis.confidence.toUpperCase()}</span>
                    {lastAnalysis.followup_needed && <><br/><span className="text-cyan-400 mt-4 inline-block font-bold bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/20">Preparing follow-up...</span></>}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
