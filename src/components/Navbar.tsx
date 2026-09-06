import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  History,
  Lock,
  Sun,
  Moon,
  BookOpen,
  User as UserIcon 
} from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  user: AuthUser | null;
  activeView: 'editor' | 'history';
  isLightMode: boolean;
  onToggleTheme: () => void;
  onViewChange: (view: 'editor' | 'history') => void;
  onNewEntry: () => void;
  onOpenThreatModel: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  isLightMode,
  onToggleTheme,
  onViewChange,
  onNewEntry,
  onOpenThreatModel,
  onOpenProfile,
  onSignOut,
}) => {
  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--ink-faint)] text-[var(--ink)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[72px] py-2 flex items-center justify-between">
        
        {/* Brand Logo in Cormorant Garamond Italic at Top-Left Corner */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group select-none" 
          onClick={() => user && onViewChange('editor')}
          title="Daybook - Return to Journal Editor"
        >
          <div className="p-2.5 rounded-xl bg-[var(--surface-card)] border-[1.5px] border-[var(--ink-faint)] group-hover:border-[var(--accent)] text-[var(--accent)] shadow-sm transition-colors flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span 
              className="font-serif text-[40px] font-bold italic tracking-tight text-[var(--ink)] leading-tight text-left"
              style={{
                fontSize: '40px',
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 'bold',
                fontStyle: 'italic',
              }}
            >
              Daybook
            </span>
            <span 
              className="text-[10px] font-bold text-[var(--ink-muted)] tracking-wide text-justify"
              style={{
                fontSize: '10px',
                fontFamily: "'Cormorant Garamond', serif",
                textAlign: 'justify',
                fontWeight: 'bold',
              }}
            >
              your daily companion
            </span>
          </div>
        </div>

        {/* Navigation, Theme Toggle & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Theme Visual Toggle */}
          <button
            onClick={onToggleTheme}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink)] border-[1.5px] border-[var(--ink-faint)] hover:border-[var(--accent)] bg-[var(--surface)] transition-all cursor-pointer hover:shadow-md"
            title="Switch Visual Appearance"
          >
            {isLightMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden md:inline">DARK_VISUALS</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden md:inline">LIGHT_VISUALS</span>
              </>
            )}
          </button>

          {user && (
            <>
              {/* View Switchers */}
              <button
                id="nav-new-entry-btn"
                onClick={onNewEntry}
                className="btn-cyber flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--ink)] text-[var(--bg)] border-[1.5px] border-[var(--ink)] hover:border-[var(--accent)] font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer hover:shadow-lg"
                title="Start a new reflection"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Entry</span>
              </button>

              <button
                id="nav-history-btn"
                onClick={() => onViewChange(activeView === 'history' ? 'editor' : 'history')}
                className={`btn-cyber flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-medium uppercase tracking-wider transition-all border-[1.5px] cursor-pointer hover:shadow-lg ${
                  activeView === 'history'
                    ? 'bg-[var(--surface)] text-[var(--accent)] border-[var(--accent)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]'
                    : 'bg-transparent text-[var(--ink-muted)] border-[var(--ink-faint)] hover:text-[var(--ink)] hover:border-[var(--accent)]'
                }`}
                title="View past entries"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
              </button>

              {/* Threat Model */}
              <button
                id="nav-threat-model-btn"
                onClick={onOpenThreatModel}
                className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--accent)] border-[1.5px] border-[var(--ink-faint)] hover:border-[var(--accent)] bg-[var(--surface)] transition-all cursor-pointer hover:shadow-md"
                title="View Security & Threat Model"
              >
                <ShieldCheck className="w-3 h-3 text-[var(--accent)]" />
                <span>THREAT_MODEL</span>
              </button>

              {/* User Profile & Sign Out */}
              <div className="flex items-center space-x-2 pl-2 border-l border-[var(--ink-faint)]">
                <button
                  id="nav-profile-btn"
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2 p-1 rounded-full sm:rounded-xl hover:bg-[var(--surface)] border border-transparent hover:border-[var(--ink-faint)] transition-all cursor-pointer group text-left"
                  title="Click to view profile & session details"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border-[1.5px] border-[var(--accent)]/50 group-hover:border-[var(--accent)] object-cover shadow-sm ring-1 ring-[var(--accent)]/20 transition-all group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-card)] border-[1.5px] border-[var(--accent)]/50 group-hover:border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-xs font-mono font-bold shadow-sm ring-1 ring-[var(--accent)]/20 transition-all group-hover:scale-105">
                      {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  <div className="hidden xl:block text-left font-mono">
                    <p className="text-[11px] font-medium text-[var(--ink)] group-hover:text-[var(--accent)] truncate max-w-[110px] transition-colors">
                      {user.displayName}
                    </p>
                    <div className="flex items-center space-x-1 text-[9px] text-[var(--accent)]">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{user.isDemo ? 'SANDBOX' : 'ISOLATED'}</span>
                    </div>
                  </div>
                </button>

                <button
                  id="nav-logout-btn"
                  onClick={onSignOut}
                  className="p-1.5 text-[var(--ink-muted)] hover:text-rose-400 border border-transparent hover:border-rose-500/30 hover:bg-rose-950/20 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </header>
  );
};

