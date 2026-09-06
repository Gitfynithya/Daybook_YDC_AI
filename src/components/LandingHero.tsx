import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Database, 
  Cpu, 
  AlertCircle,
  KeyRound,
  ShieldAlert,
  Lock
} from 'lucide-react';

interface LandingHeroProps {
  onGoogleSignIn: () => Promise<void>;
  onDemoSignIn: () => void;
  isLoading: boolean;
  authError: string | null;
  onOpenThreatModel: () => void;
  isLightMode?: boolean;
  onToggleTheme?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onGoogleSignIn,
  onDemoSignIn,
  isLoading,
  authError,
  onOpenThreatModel,
  isLightMode,
  onToggleTheme,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-10 overflow-hidden">
      
      {/* Ambient Glow Blob */}
      <div 
        className="glow-ambient-blob top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2" 
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Editorial Mono Meta Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 mb-4 border border-[var(--ink-faint)] bg-[var(--surface)] text-[11px] font-mono uppercase tracking-[0.25em] text-[var(--accent)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>GEMINI 3.6 FLASH INTEGRATION</span>
        </div>

        {/* Display Headline */}
        <h1 className="font-serif text-[35px] font-bold text-center px-[9px] mx-[5px] tracking-tight text-[var(--ink)] leading-[1.08] max-w-3xl my-3">
          A private daybook for <i className="font-serif font-normal italic text-[var(--accent)]">deep reflection</i> and <i className="font-serif font-bold italic">proactive insights.</i>
        </h1>

        {/* Lead Description */}
        <p className="max-w-xl text-sm sm:text-base text-[var(--ink-muted)] font-light leading-relaxed mb-8 mt-2">
          Write your thoughts, converse with an empathic AI companion, and automatically identify future commitments, deadlines, and personal milestones.
        </p>

        {/* Auth Error Banner if needed */}
        {authError && (
          <div className="w-full max-w-md mb-6 p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs text-left flex items-start space-x-2.5 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{authError}</p>
              <p className="text-[10px] text-rose-400/80 mt-0.5">
                Popup blocked in iframe sandbox? Use the Sandbox Preview button below to explore immediately.
              </p>
            </div>
          </div>
        )}

        {/* Sharp Auth Button Container */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          {/* Primary Google Sign-In */}
          <button
            id="google-signin-btn"
            onClick={onGoogleSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto btn-cyber px-8 py-3.5 rounded-xl bg-[var(--ink)] text-[var(--bg)] border-[1.5px] border-[var(--ink)] font-mono text-xs font-semibold uppercase tracking-wider hover:border-[var(--accent)] transition-all cursor-pointer flex items-center justify-center space-x-3 disabled:opacity-50 hover:shadow-2xl shadow-md"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Secondary Sandbox Preview */}
          <button
            id="demo-signin-btn"
            onClick={onDemoSignIn}
            className="w-full sm:w-auto btn-cyber px-6 py-3.5 rounded-xl bg-transparent text-[var(--ink)] border-[1.5px] border-[var(--ink-faint)] hover:border-[var(--accent)] font-mono text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 hover:shadow-xl shadow-sm"
          >
            <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Sandbox Preview</span>
          </button>
        </div>

        {/* Architectural Pillars / Technical Row */}
        <div className="w-full mt-14 pt-8 border-t border-[var(--ink-faint)] grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-4 border border-[var(--ink-faint)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors">
            <h4 className="font-mono text-[11px] font-bold text-[var(--accent)] tracking-widest uppercase mb-1.5 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>CONVERSATIONAL</span>
            </h4>
            <p className="text-xs text-[var(--ink-muted)] font-light leading-relaxed">
              Gemini 3.6 Flash with automated fallback resilience ladder (3.6, 3.1-Lite, flash-latest).
            </p>
          </div>

          <div className="p-4 border border-[var(--ink-faint)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors">
            <h4 className="font-mono text-[11px] font-bold text-[var(--accent)] tracking-widest uppercase mb-1.5 flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>ENCRYPTED</span>
            </h4>
            <p className="text-xs text-[var(--ink-muted)] font-light leading-relaxed">
              Strict document ownership via isolated Cloud Firestore security rules with zero cross-user access.
            </p>
          </div>

          <div className="p-4 border border-[var(--ink-faint)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors">
            <h4 className="font-mono text-[11px] font-bold text-[var(--accent)] tracking-widest uppercase mb-1.5 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SECURE</span>
            </h4>
            <p className="text-xs text-[var(--ink-muted)] font-light leading-relaxed">
              Zero browser-side exposure for sensitive API endpoints with Google Cloud Secret Manager.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

