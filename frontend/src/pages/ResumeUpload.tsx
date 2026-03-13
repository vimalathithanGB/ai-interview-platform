import { useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  FolderKanban,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Brain,
  Target,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setProfile,
  setUploadLoading,
  setCompany,
  setInterviewType,
  setTargetRole,
  setCurrentQuestion,
} from '../store/interviewSlice';
import { uploadResume, configureInterview, startInterview } from '../services/api';

interface ConfigForm {
  company: string;
  interviewType: 'technical' | 'non_technical' | 'mixed';
  targetRole: string;
  mode: 'text' | 'voice';
}

export default function ResumeUpload() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { profile, uploadLoading } = useAppSelector((s) => s.interview);

  const [dragOver, setDragOver] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit } = useForm<ConfigForm>({
    defaultValues: { company: '', interviewType: 'mixed', targetRole: '', mode: 'text' },
  });

  // ---- File handling ----
  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File exceeds 5 MB limit');
        return;
      }

      dispatch(setUploadLoading(true));

      try {
        const res = await uploadResume(file);
        dispatch(setProfile(res.profile));
        toast.success('Resume parsed successfully!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        toast.error(msg);
      } finally {
        dispatch(setUploadLoading(false));
      }
    },
    [dispatch],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  // ---- Start interview ----
  const onStart = handleSubmit(async (data) => {
    if (!profile) {
      toast.error('Upload a resume first');
      return;
    }

    setStartLoading(true);

    try {
      dispatch(setCompany(data.company));
      dispatch(setInterviewType(data.interviewType));
      dispatch(setTargetRole(data.targetRole));

      await configureInterview(data.company || 'Generic Tech Company', data.interviewType, data.mode);

      const firstQuestion = await startInterview(
        { name: profile.name, skills: profile.skills, target_role: data.targetRole || profile.target_role || '' },
        {
          projects: profile.projects ?? [],
          education: profile.education ?? '',
          experience: profile.experience ?? '',
        },
      );

      dispatch(setCurrentQuestion(firstQuestion));
      navigate('/interview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start interview';
      toast.error(msg);
    } finally {
      setStartLoading(false);
    }
  });

  return (
    <div className="min-h-[calc(100vh-80px)] relative overflow-hidden text-white flex flex-col justify-center">
      {/* Background gradients and stars */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[#0A051E]">
        <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-white/40 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        <div className="absolute top-[25%] right-[20%] w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute bottom-[20%] left-[30%] w-1.5 h-1.5 bg-indigo-400/50 rounded-full blur-[1px]" />
        <div className="absolute top-[40%] right-[30%] w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute bottom-[40%] left-[15%] w-2 h-2 bg-blue-400/30 rounded-full blur-[2px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-12 relative z-10 w-full">
        {!profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
            {/* Left: Info & Marketing */}
            <div className="space-y-6 animate-fade-in pr-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold tracking-wide uppercase mb-2">
                <Sparkles size={14} /> AI-Powered Analysis
              </div>
              <h1 className="text-4xl sm:text-5xl font-medium tracking-tight leading-[1.15]">
                Upload Resume,<br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Master the Interview.</span>
              </h1>
              <p className="text-indigo-200/70 text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
                Drop your PDF below. Our engine instantly analyzes your skills, experience, and education to generate a personalized, dynamic mock interview session just for you.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 text-left">
                <div className="bg-[#110A2B]/40 border border-white/5 rounded-xl p-5 shadow-lg backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-3">
                    <FileText size={18} className="text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-medium text-white">Smart Parsing</h3>
                  <p className="text-xs text-indigo-200/50 mt-1.5 leading-relaxed">Instantly extracts skills, education, and career milestones from any standard format.</p>
                </div>
                <div className="bg-[#110A2B]/40 border border-white/5 rounded-xl p-5 shadow-lg backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                    <Brain size={18} className="text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-medium text-white">Adaptive AI</h3>
                  <p className="text-xs text-indigo-200/50 mt-1.5 leading-relaxed">Questions evolve dynamically in real-time based on the answers you provide.</p>
                </div>
              </div>
            </div>

            {/* Right: Drop zone */}
            <div className="animate-fade-in flex justify-center lg:justify-end">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-md bg-[#0A051E]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] cursor-pointer transition-all duration-300 ${
                  dragOver ? 'border-indigo-500/50 scale-[1.02] bg-indigo-900/10' : 'hover:border-white/10 hover:bg-[#110A2B]/40'
                }`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={onFileSelect} />

                {uploadLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="spinner !w-10 !h-10 !border-4 !border-indigo-500/20 !border-t-indigo-400" />
                    <p className="text-sm font-medium text-indigo-200 animate-pulse">Running AI extraction…</p>
                  </div>
                ) : (
                  <>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${dragOver ? 'bg-indigo-500/20 scale-110' : 'bg-indigo-500/10'}`}>
                      <Upload size={36} className={dragOver ? 'text-indigo-300' : 'text-indigo-400'} />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium text-white">
                        Drag & drop your <span className="text-indigo-400">Resume</span>
                      </p>
                      <p className="text-sm text-indigo-200/50">or click to browse your files</p>
                    </div>
                    <div className="mt-8 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-wider text-indigo-200/40">
                      Supports PDF up to 5 MB
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            {/* Header for Uploaded state */}
            <div className="text-center space-y-3 mb-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-3xl font-medium tracking-tight">Profile Extracted Successfully</h2>
              <p className="text-indigo-200/60 max-w-xl mx-auto">Review your parsed details below and configure your customized interview parameters before starting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile display */}
              <div className="lg:col-span-2 bg-[#0A051E]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-white">
                    <User size={18} className="text-cyan-400" />
                    Candidate Profile
                  </h3>
                  <button 
                    type="button"
                    onClick={() => dispatch(setProfile(null as any))}
                    className="text-xs text-indigo-300/60 hover:text-indigo-300 transition-colors py-1 px-3 rounded border border-white/5 hover:bg-white/5"
                  >
                    Upload Different Resume
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                  <InfoBlock icon={User} label="Full Name" value={profile.name} />
                  <InfoBlock icon={Briefcase} label="Experience Level" value={profile.experience} />
                  <InfoBlock icon={GraduationCap} label="Highest Education" value={profile.education} />
                  <InfoBlock
                    icon={FolderKanban}
                    label="Key Projects"
                    value={profile.projects?.length ? profile.projects.join(', ') : 'None extracted'}
                  />
                </div>

                {/* Skills */}
                <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-indigo-300/40 mb-3">Extracted Skills</p>
                  <div className="flex flex-wrap gap-2.5">
                    {profile.skills?.length ? (
                      profile.skills.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-200 border border-indigo-500/20"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-indigo-200/40 text-sm flex items-center gap-1">
                        <XCircle size={14} /> No technical skills identified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Interview Config Form */}
              <div className="bg-[#0A051E]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden h-fit">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <form onSubmit={onStart} className="space-y-6">
                  <h3 className="text-lg font-medium flex items-center gap-2 text-white mb-2">
                    <Target size={18} className="text-indigo-400" />
                    Interview Settings
                  </h3>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-medium text-indigo-200/60">Target Company</label>
                      <input
                        {...register('company')}
                        placeholder="e.g. Google, Stripe"
                        className="w-full bg-[#110A2B]/60 border border-indigo-500/10 rounded-xl px-4 py-3 text-sm text-white placeholder-indigo-300/30 focus:outline-none focus:border-indigo-500/40 focus:bg-[#150D35]/80 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-medium text-indigo-200/60">Interview Type</label>
                      <select
                        {...register('interviewType')}
                        className="w-full bg-[#110A2B]/60 border border-indigo-500/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/40 focus:bg-[#150D35]/80 transition-all appearance-none"
                      >
                        <option value="mixed">Mixed (Technical & Behavioral)</option>
                        <option value="technical">Technical Only</option>
                        <option value="non_technical">Behavioral Only</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-medium text-indigo-200/60">Desired Role</label>
                      <input
                        {...register('targetRole')}
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full bg-[#110A2B]/60 border border-indigo-500/10 rounded-xl px-4 py-3 text-sm text-white placeholder-indigo-300/30 focus:outline-none focus:border-indigo-500/40 focus:bg-[#150D35]/80 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-medium text-indigo-200/60">Input Mode</label>
                      <select
                        {...register('mode')}
                        className="w-full bg-[#110A2B]/60 border border-indigo-500/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/40 focus:bg-[#150D35]/80 transition-all appearance-none"
                      >
                        <option value="text">Text Only</option>
                        <option value="voice">Voice & Text</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={startLoading} 
                    className="w-full py-3.5 mt-4 rounded-xl text-sm font-medium text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(to right, #a855f7, #3b82f6, #06b6d4)' }}
                  >
                    {startLoading ? (
                      <>
                        <div className="spinner !w-4 !h-4 !border-2" />
                        Initializing AI…
                      </>
                    ) : (
                      <>
                        Start Session <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- tiny helper ---------- */
function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5 break-words">
      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-indigo-300/40 flex items-center gap-2">
        <Icon size={12} className="text-indigo-400/70" /> {label}
      </p>
      <p className="text-sm font-medium text-white leading-relaxed">{value || 'Not specified'}</p>
    </div>
  );
}
