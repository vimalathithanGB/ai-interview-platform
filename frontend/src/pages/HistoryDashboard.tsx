import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Trash2,
  RefreshCw,
  CalendarDays,
  Timer,
  Target,
  Zap,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setHistory, clearHistory } from '../store/interviewSlice';
import { getInterviewHistory, clearInterviewHistory, type InterviewHistoryEntry } from '../services/api';
import toast from 'react-hot-toast';

const recColors: Record<string, { bg: string; text: string; border: string }> = {
  'Strong Hire': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  Hire:          { bg: 'bg-cyan-500/10',  text: 'text-cyan-400',  border: 'border-cyan-500/30'  },
  Consider:      { bg: 'bg-yellow-500/10',text: 'text-yellow-400',border: 'border-yellow-500/30'},
  Reject:        { bg: 'bg-red-500/10',   text: 'text-red-400',   border: 'border-red-500/30'   },
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function typeLabel(t: string) {
  if (t === 'technical')    return 'Technical';
  if (t === 'non_technical') return 'Behavioral';
  return 'Mixed';
}

/* ─── Summary card ─────────────────────────────────────────────────────── */
function SummaryCard({
  icon: Icon, label, value, sub, color = 'text-indigo-400',
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[#0A051E]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center gap-2 shadow-xl">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-1 bg-white/5 border border-white/10 ${color}`}>
        <Icon size={22} />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-200/40">{label}</p>
      {sub && <p className="text-xs text-indigo-300/50">{sub}</p>}
    </div>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────── */
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center animate-fade-in">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.15)]">
          <BarChart3 size={40} className="text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0A051E] border border-indigo-500/30 flex items-center justify-center">
          <Zap size={12} className="text-indigo-400" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">No interviews yet</h3>
        <p className="text-sm text-indigo-200/50 max-w-xs">
          Your interview history will appear here after you complete your first session.
          New accounts always start at zero — every session you complete is tracked.
        </p>
      </div>
      <button
        onClick={onNew}
        className="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
        style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)' }}
      >
        Start Your First Interview
      </button>
    </div>
  );
}

/* ─── History entry card ───────────────────────────────────────────────── */
function HistoryCard({ entry, index }: { entry: InterviewHistoryEntry; index: number }) {
  const rec = recColors[entry.recommendation] ?? recColors.Consider;
  const scorePercent = Math.min((entry.average_score / 2) * 100, 100);

  return (
    <details className="group bg-[#110A2B]/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-lg overflow-hidden hover:border-indigo-500/20 transition-all">
      <summary className="flex items-center gap-4 p-5 cursor-pointer list-none select-none">
        {/* Index badge */}
        <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
          #{index + 1}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {entry.company || 'General Interview'}
            <span className="ml-2 text-xs font-normal text-indigo-300/50">
              · {typeLabel(entry.interview_type)}
            </span>
          </p>
          <p className="text-xs text-indigo-300/40 mt-0.5 flex items-center gap-1.5">
            <CalendarDays size={11} />
            {formatDate(entry.date_taken)}
            {entry.duration_seconds > 0 && (
              <>
                <span className="text-indigo-500/30">·</span>
                <Timer size={11} />
                {formatDuration(entry.duration_seconds)}
              </>
            )}
          </p>
        </div>

        {/* Score bar */}
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 w-28">
          <span className="text-xs font-semibold text-white">{scorePercent.toFixed(0)}%</span>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${scorePercent}%`,
                background: scorePercent >= 75 ? '#22d3ee' : scorePercent >= 50 ? '#eab308' : '#f87171',
              }}
            />
          </div>
        </div>

        {/* Recommendation badge */}
        <span className={`shrink-0 text-[11px] font-bold px-3 py-1 rounded-full border ${rec.bg} ${rec.text} ${rec.border}`}>
          {entry.recommendation || 'N/A'}
        </span>

        <ChevronRight
          size={16}
          className="shrink-0 text-indigo-400/40 transition-transform group-open:rotate-90"
        />
      </summary>

      {/* Expanded detail */}
      <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-5 animate-fade-in">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-3">
          {[
            { label: 'Questions', value: `${entry.answered_questions} / ${entry.total_questions}` },
            { label: 'Avg Score', value: `${scorePercent.toFixed(0)}%` },
            { label: 'Duration', value: formatDuration(entry.duration_seconds) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/3 rounded-xl p-3 text-center border border-white/5">
              <p className="text-sm font-bold text-white">{value}</p>
              <p className="text-[10px] uppercase tracking-wider text-indigo-300/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-cyan-400 flex items-center gap-1.5">
              <TrendingUp size={12} /> Strengths
            </p>
            {entry.strengths.length > 0 ? (
              <ul className="space-y-1.5">
                {entry.strengths.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-xs text-indigo-100/80">
                    <CheckCircle2 size={11} className="text-cyan-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-indigo-300/30 italic">None recorded</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-red-400 flex items-center gap-1.5">
              <TrendingDown size={12} /> Areas to Improve
            </p>
            {entry.improvements.length > 0 ? (
              <ul className="space-y-1.5">
                {entry.improvements.map((w) => (
                  <li key={w} className="flex items-center gap-2 text-xs text-indigo-100/80">
                    <AlertTriangle size={11} className="text-red-400 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-indigo-300/30 italic">None recorded</p>
            )}
          </div>
        </div>

        {/* Topics */}
        {entry.topics_covered.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-300/40 flex items-center gap-1.5">
              <Tag size={11} /> Topics Covered
            </p>
            <div className="flex flex-wrap gap-2">
              {entry.topics_covered.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/10 text-indigo-200 border border-indigo-500/20"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function HistoryDashboard() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const user      = useAppSelector((s) => s.auth.user);
  const history   = useAppSelector((s) => s.interview.history);
  const loaded    = useAppSelector((s) => s.interview.historyLoaded);

  const [loading,  setLoading]  = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const data = await getInterviewHistory(user.email);
      dispatch(setHistory(data));
    } catch {
      toast.error('Could not load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loaded) fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const handleClear = async () => {
    if (!user?.email) return;
    if (!window.confirm('Clear all interview history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await clearInterviewHistory(user.email);
      dispatch(clearHistory());
      toast.success('History cleared.');
    } catch {
      toast.error('Failed to clear history.');
    } finally {
      setClearing(false);
    }
  };

  /* derived stats */
  const totalInterviews = history.length;
  const avgScore   = totalInterviews
    ? ((history.reduce((s, h) => s + h.average_score, 0) / totalInterviews / 2) * 100).toFixed(0)
    : '—';
  const bestScore  = totalInterviews
    ? `${((Math.max(...history.map((h) => h.average_score)) / 2) * 100).toFixed(0)}%`
    : '—';
  const totalTime  = formatDuration(history.reduce((s, h) => s + (h.duration_seconds || 0), 0));

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <section className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-white">
            Interview{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent font-bold">
              History
            </span>
          </h2>
          <p className="text-sm text-indigo-200/40 mt-1">
            Self-tracking — every session you complete is saved here
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-200 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {totalInterviews > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>
      </section>

      {/* ── Summary cards ── */}
      {totalInterviews > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={Award}      label="Total Interviews" value={String(totalInterviews)} color="text-indigo-400" />
          <SummaryCard icon={BarChart3}  label="Avg Score"        value={typeof avgScore === 'string' ? avgScore : `${avgScore}%`} sub="across all sessions" color="text-cyan-400" />
          <SummaryCard icon={Target}     label="Best Score"       value={bestScore}  color="text-green-400" />
          <SummaryCard icon={Clock}      label="Total Time"       value={totalTime}  sub="interview practice" color="text-purple-400" />
        </div>
      )}

      {/* ── Progress trend ── */}
      {totalInterviews >= 2 && (
        <div className="bg-[#0A051E]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 space-y-3 shadow-xl">
          <p className="text-xs uppercase font-bold tracking-[0.2em] text-indigo-300/50 flex items-center gap-2">
            <TrendingUp size={13} className="text-cyan-400" /> Score Trend
          </p>
          <div className="flex items-end gap-2 h-16">
            {[...history].reverse().map((h, i) => {
              const pct = Math.min((h.average_score / 2) * 100, 100);
              const color = pct >= 75 ? '#22d3ee' : pct >= 50 ? '#eab308' : '#f87171';
              return (
                <div key={h.id} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{ height: `${Math.max(pct, 6)}%`, backgroundColor: color, opacity: 0.8 }}
                    title={`Session ${i + 1}: ${pct.toFixed(0)}%`}
                  />
                  <span className="text-[9px] text-indigo-300/30 group-hover:text-indigo-300/60">
                    #{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── History list ── */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="spinner" />
        </div>
      ) : totalInterviews === 0 ? (
        <EmptyState onNew={() => navigate('/')} />
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-indigo-300/40 pl-1">
            {totalInterviews} session{totalInterviews !== 1 ? 's' : ''} · newest first
          </p>
          {history.map((entry, i) => (
            <HistoryCard key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
