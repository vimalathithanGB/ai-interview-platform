import { useNavigate } from 'react-router-dom';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Hash,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  Download,
  RotateCcw,
  Gauge,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { resetAll } from '../store/interviewSlice';

const recommendationStyles: Record<string, { bg: string; text: string; border: string; iconColor: string }> = {
  'Strong Hire': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', iconColor: 'text-green-400' },
  Hire: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', iconColor: 'text-cyan-400' },
  Consider: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', iconColor: 'text-yellow-400' },
  Reject: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', iconColor: 'text-red-400' },
};

export default function ResultsDashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { report, answerHistory  } = useAppSelector((s) => s.interview);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0A051E]/40 border border-white/5 flex items-center justify-center shadow-lg backdrop-blur-md">
          <BarChart3 size={32} className="text-indigo-400" />
        </div>
        <p className="text-indigo-200/60 font-medium">No results yet. Complete an interview first.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
          style={{ background: 'linear-gradient(to right, #a855f7, #3b82f6)' }}
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const recStyle = recommendationStyles[report.recommendation] ?? recommendationStyles.Consider;
  const scorePercent = Math.min((report.average_score / 2) * 100, 100);

  // ---- Export ----
  const handleExport = () => {
    if (report.report_url) {
      const link = document.createElement('a');
      link.href = `http://localhost:8000${report.report_url}`;
      link.target = '_blank';
      link.download = `Interview_Report_${report.candidate_name || 'Candidate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleNewInterview = () => {
    dispatch(resetAll());
    navigate('/');
  };

  const understandingConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    good: { color: 'text-cyan-400', icon: TrendingUp, label: 'Good' },
    partial: { color: 'text-yellow-400', icon: Gauge, label: 'Partial' },
    low: { color: 'text-red-400', icon: AlertTriangle, label: 'Low' },
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto py-4">
      {/* Header */}
      <section className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-white">
            Interview{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent font-bold">
              Results
            </span>
          </h2>
          {report.candidate_name && <p className="text-indigo-200/80 font-medium mt-1.5">{report.candidate_name}</p>}
          {report.role && <p className="text-sm text-indigo-300/40">{report.role}</p>}
        </div>

        <div className="flex gap-3">
          {report.report_url && (
            <button 
              onClick={handleExport} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-indigo-200 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all hover:text-white"
            >
              <Download size={16} /> Download PDF
            </button>
          )}
          <button 
            onClick={handleNewInterview} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
            style={{ background: 'linear-gradient(to right, #a855f7, #3b82f6)' }}
          >
            <RotateCcw size={16} /> New Interview
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {/* Recommendation */}
        <div className={`bg-[#0A051E]/40 backdrop-blur-xl rounded-2xl p-6 text-center space-y-3 col-span-2 md:col-span-1 border shadow-lg ${recStyle.bg} ${recStyle.border}`}>
          <div className="flex justify-center">
            <Award size={32} className={recStyle.text} />
          </div>
          <p className={`text-2xl font-bold tracking-tight ${recStyle.text}`}>{report.recommendation}</p>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-200/40">Recommendation</p>
        </div>

        {/* Score */}
        <StatCard icon={Star} label="Avg Score" value={`${scorePercent.toFixed(0)}%`} sub={`${report.average_score.toFixed(2)} / 2.0`} />

        {/* Questions */}
        <StatCard icon={Hash} label="Total Questions" value={String(report.total_questions)} sub={`${report.answered_questions} answered`} />

        {/* Answered */}
        <StatCard icon={CheckCircle2} label="Answered" value={String(report.answered_questions)} sub={`of ${report.total_questions}`} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#0A051E]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8 space-y-5 shadow-xl">
          <h4 className="text-sm font-bold flex items-center gap-2 text-cyan-400 uppercase tracking-widest">
            <TrendingUp size={18} /> Strengths
          </h4>
          {report.strengths.length > 0 ? (
            <ul className="space-y-3">
              {report.strengths.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm text-indigo-100/80 leading-relaxed">
                  <div className="mt-0.5 p-1 rounded-full bg-cyan-500/10 text-cyan-400 shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-indigo-300/40 italic">No notable strengths recorded</p>
          )}
        </div>

        <div className="bg-[#0A051E]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8 space-y-5 shadow-xl">
          <h4 className="text-sm font-bold flex items-center gap-2 text-red-400 uppercase tracking-widest">
            <TrendingDown size={18} /> Areas for Improvement
          </h4>
          {report.weaknesses.length > 0 ? (
            <ul className="space-y-3">
              {report.weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-3 text-sm text-indigo-100/80 leading-relaxed">
                  <div className="mt-0.5 p-1 rounded-full bg-red-500/10 text-red-400 shrink-0">
                    <AlertTriangle size={12} />
                  </div>
                  {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-indigo-300/40 italic">No notable weaknesses</p>
          )}
        </div>
      </div>

      {/* Topics */}
      {report.topics_covered.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-300/40 pl-1">Topics Covered</p>
          <div className="flex flex-wrap gap-2.5">
            {report.topics_covered.map((t) => (
              <span
                key={t}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-200 border border-indigo-500/20 shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-question review */}
      {answerHistory.length > 0 && (
        <div className="space-y-4 pt-6 mt-4 border-t border-white/5">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 pl-1">
            <BarChart3 size={18} className="text-indigo-400" /> Question-by-Question Review
          </h4>
          <div className="space-y-3">
            {answerHistory.map((entry, i) => {
              const cfg = understandingConfig[entry.analysis.understanding] ?? understandingConfig.partial;
              const Icon = cfg.icon;
              return (
                <details key={i} className="bg-[#110A2B]/40 backdrop-blur-md border border-white/5 rounded-xl p-5 group shadow-lg">
                  <summary className="flex items-center gap-3 cursor-pointer list-none">
                    <ChevronRight size={16} className="text-indigo-400/50 transition-transform group-open:rotate-90 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-white truncate">
                      <span className="text-indigo-400/80 mr-2">Q{entry.question.question_number}:</span>
                      {entry.question.question}
                    </span>
                    <span className={`text-[11px] font-bold tracking-wider px-2 py-1 rounded bg-white/5 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <Icon size={16} className={cfg.color} />
                  </summary>
                  <div className="mt-5 pl-7 pr-4 space-y-4 border-t border-white/5 pt-4 text-sm">
                    <p className="text-indigo-100/90 leading-relaxed">
                      <span className="text-indigo-400/50 uppercase text-[10px] font-bold tracking-wider block mb-1">Topic Answered</span>
                      <span className="inline-block px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">
                        {entry.question.topic}
                      </span>
                    </p>
                    <p className="text-indigo-100/90 leading-relaxed">
                      <span className="text-indigo-400/50 uppercase text-[10px] font-bold tracking-wider block mb-1">Your Answer</span>
                      {entry.answer}
                    </p>
                    <div className={`p-3 rounded-lg bg-black/20 border border-white/5 flex items-center gap-3 ${cfg.color}`}>
                      <Icon size={16} />
                      <p className="font-medium text-xs">
                        {cfg.label} · <span className="text-white/60">Confidence:</span> <span className="capitalize text-white/90">{entry.analysis.confidence}</span>
                      </p>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helper ---------- */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#0A051E]/40 backdrop-blur-xl border border-white/5 shadow-lg p-6 space-y-3 text-center rounded-2xl">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
        <Icon size={22} />
      </div>
      <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200/40">{label}</p>
      {sub && <p className="text-xs text-indigo-300/50 font-medium">{sub}</p>}
    </div>
  );
}
