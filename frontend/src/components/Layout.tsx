import { useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Brain, FileText, MessageSquare, BarChart3, LogOut, History } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';
import { setHistory } from '../store/interviewSlice';
import { getInterviewHistory } from '../services/api';

const navItems = [
  { to: '/',         label: 'Upload',    icon: FileText      },
  { to: '/interview',label: 'Interview', icon: MessageSquare },
  { to: '/results',  label: 'Results',   icon: BarChart3     },
  { to: '/history',  label: 'History',   icon: History       },
];

export default function Layout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const user      = useAppSelector((s) => s.auth.user);
  const loaded    = useAppSelector((s) => s.interview.historyLoaded);

  // Hide nav links while interview is in progress
  const isInterviewing = location.pathname === '/interview';

  // ── Auto-load history once per login session ──────────────────────────
  useEffect(() => {
    if (user?.email && !loaded) {
      getInterviewHistory(user.email)
        .then((data) => dispatch(setHistory(data)))
        .catch(() => {/* silent — history page has its own refresh button */});
    }
  }, [user, loaded, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A051E] text-white overflow-x-hidden relative">
      {/* Background gradients and stars */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-white/30 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        <div className="absolute top-[25%] right-[20%] w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute bottom-[20%] left-[30%] w-1.5 h-1.5 bg-indigo-400/40 rounded-full blur-[1px]" />
        <div className="absolute top-[40%] right-[30%] w-1 h-1 bg-white/20 rounded-full" />
        <div className="absolute bottom-[40%] left-[15%] w-2 h-2 bg-blue-400/20 rounded-full blur-[2px]" />
      </div>

      {/* Top Nav */}
      <header className="bg-[#0A051E]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary-300 to-accent-400 bg-clip-text text-transparent">
            AI Interview Platform
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Nav icons — hidden during the interview, visible otherwise */}
          {!isInterviewing && (
            <nav className="flex gap-1">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/20'
                        : 'text-indigo-200/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                );
              })}
            </nav>
          )}

          {/* During interview: show "In Session" badge instead of nav */}
          {isInterviewing && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Interview in Progress
            </div>
          )}

          {/* User + Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-surface-700/40">
            {user && (
              <span className="text-xs text-indigo-200/50 hidden sm:block">
                {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-200/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              title="Sign out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-indigo-300/30 py-4 border-t border-white/5 relative z-10 bg-[#0A051E]/40 backdrop-blur-sm">
        AI Interview Platform &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
