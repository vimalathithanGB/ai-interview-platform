import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/authSlice';

interface LoginForm {
  name: string;
  email: string;
  password: string;
}

export default function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);

    // Simulate a brief auth delay
    await new Promise((r) => setTimeout(r, 800));

    dispatch(login({ name: data.name || data.email.split('@')[0], email: data.email }));
    toast.success(`Welcome${data.name ? ', ' + data.name : ''}!`);
    navigate('/');

    setIsLoading(false);
  });

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A051E] text-white">
      {/* Background gradients and stars */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-indigo-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[40rem] h-[40rem] bg-blue-900/20 rounded-full blur-[120px]" />
        {/* Synthetic "stars" generated using small boxes */}
        <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-white/40 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        <div className="absolute top-[25%] left-[20%] w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute bottom-[20%] left-[30%] w-1.5 h-1.5 bg-indigo-400/50 rounded-full blur-[1px]" />
        <div className="absolute top-[40%] right-[30%] w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute bottom-[10%] right-[15%] w-2 h-2 bg-blue-400/40 rounded-full blur-[2px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Column: Typography */}
        <div className="space-y-8 animate-fade-in hidden lg:block pr-8">
          <div className="space-y-4">
            <h4 className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-indigo-300/80 font-semibold font-sans">
              AI Interview Platform
            </h4>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.15]">
              Welcome to AI Interview Platform
            </h1>
            <p className="text-indigo-200/70 text-base leading-relaxed max-w-md pt-2">
              Practice intelligent AI-driven interviews with voice interaction and real-time evaluation.
            </p>
          </div>

          <ul className="space-y-4 pt-4">
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-indigo-100/80 text-sm">Voice-powered mock interview sessions</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-indigo-100/80 text-sm">Resume intelligence and preparation insights</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-indigo-100/80 text-sm">Performance analytics designed like a modern SaaS dashboard</span>
            </li>
          </ul>
        </div>

        {/* Right Column: Form Card */}
        <div className="animate-fade-in flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-[#0A051E]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Subtle card glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            
            <div className="space-y-3 mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-300/60 font-semibold font-sans">
                {isSignUp ? 'Create Account' : 'Secure Sign In'}
              </p>
              <h2 className="text-3xl font-medium tracking-tight">
                {isSignUp ? 'Join AI Interview Platform' : 'Welcome to AI Interview Platform'}
              </h2>
              <p className="text-indigo-200/60 text-sm leading-relaxed">
                Practice intelligent AI-driven interviews with voice interaction and real-time evaluation.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              
              {isSignUp && (
                <div className="space-y-2 relative">
                  <label className="text-xs text-indigo-200/80 font-medium">Name</label>
                  <div className="relative flex items-center">
                    <input
                      {...register('name')}
                      placeholder="John Doe"
                      className="w-full bg-[#110A2B]/60 border border-indigo-500/10 rounded-xl px-4 py-3 text-sm text-white placeholder-indigo-300/30 focus:outline-none focus:border-indigo-500/40 focus:bg-[#150D35]/80 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-indigo-200/80 font-medium">Email</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 text-indigo-400/50" size={16} />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                    })}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-[#110A2B]/60 border border-indigo-500/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-indigo-300/30 focus:outline-none focus:border-indigo-500/40 focus:bg-[#150D35]/80 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-indigo-200/80 font-medium">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 text-indigo-400/50" size={16} />
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 4, message: 'At least 4 characters' },
                    })}
                    type="password"
                    placeholder="Enter your password"
                    className="w-full bg-[#110A2B]/60 border border-indigo-500/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-indigo-300/30 focus:outline-none focus:border-indigo-500/40 focus:bg-[#150D35]/80 transition-all"
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-400">{errors.password.message}</p>
                )}
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div 
                      className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors duration-200 ${rememberMe ? 'bg-indigo-500' : 'bg-indigo-900/50'}`}
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${rememberMe ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-xs text-indigo-200/70 group-hover:text-indigo-200 transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    Forgot password
                  </a>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl text-sm font-medium text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(to right, #a855f7, #3b82f6, #06b6d4)' }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner !w-4 !h-4 !border-2" />
                    {isSignUp ? 'Creating...' : 'Signing in...'}
                  </span>
                ) : (
                  <span>{isSignUp ? 'Create Account' : 'Start AI Interview'}</span>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-indigo-200/50">
                {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  {isSignUp ? 'Sign in instead' : 'Create your account'}
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
