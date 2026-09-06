import React, { useState } from 'react';
import { 
  Bell, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Compass, 
  ArrowRight,
  Clock,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { ReminderAnalysisResult, ReminderTask } from '../types';

interface DailyDigestBannerProps {
  digest: ReminderAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPrompt?: (promptText: string) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onClearAllTasks?: () => void;
  onToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
  completedTaskIds?: string[];
  totalEntriesCount: number;
}

export const DailyDigestBanner: React.FC<DailyDigestBannerProps> = ({
  digest,
  isLoading,
  onRefresh,
  onSelectPrompt,
  onToggleTaskComplete,
  onClearAllTasks,
  onToast,
  completedTaskIds = [],
  totalEntriesCount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isContentCleared, setIsContentCleared] = useState(false);

  const hasPendingReminders = Boolean(digest?.hasReminders && digest.reminders.length > 0);

  const handleClearAllContent = () => {
    if (hasPendingReminders && digest) {
      if (onClearAllTasks) {
        onClearAllTasks();
      } else if (onToggleTaskComplete) {
        digest.reminders.forEach((r) => {
          if (!completedTaskIds.includes(r.id)) {
            onToggleTaskComplete(r.id);
          }
        });
      }
      onToast?.('All active commitments marked as clear.', 'success');
    } else {
      if (isContentCleared) {
        setIsContentCleared(false);
        onToast?.('Daily digest content restored.', 'info');
      } else {
        setIsContentCleared(true);
        onToast?.('Respective digest content cleared.', 'info');
      }
    }
  };

  if (isDismissed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-2">
        <button
          onClick={() => setIsDismissed(false)}
          className="flex items-center space-x-2 text-xs font-mono text-[var(--accent)] hover:underline bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--ink-faint)] transition-all cursor-pointer hover:shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>[ RE-OPEN DAILY AI DIGEST ]</span>
        </button>
      </div>
    );
  }

  if (isLoading && !digest) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 mb-4">
        <div className="bg-[var(--surface)] border border-[var(--ink-faint)] p-5 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-9 h-9 border border-[var(--accent)]/40 bg-[var(--surface-card)] flex items-center justify-center text-[var(--accent)]">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--ink)] font-semibold">
                DAYBOOK AI ENGINE // REVIEWING REFLECTIONS...
              </p>
              <p className="text-xs text-[var(--ink-muted)] font-light mt-0.5">
                Analyzing entries for commitments, milestones, or crafting your daily cognitive motivation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!digest) {
    return null;
  }

  const activeRemindersCount = digest.reminders.filter(r => !completedTaskIds.includes(r.id)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 mb-3">
      <div 
        id="ai-daily-digest-card"
        className={`relative overflow-hidden border rounded-2xl transition-all duration-300 ${
          hasPendingReminders
            ? 'bg-[var(--surface)] border-[var(--accent)]/50 shadow-[0_8px_30px_var(--accent-glow)] hover:shadow-[0_12px_35px_var(--accent-glow)]'
            : 'bg-[var(--surface)] border-[var(--ink-faint)] shadow-md hover:shadow-lg'
        }`}
        style={{
          boxShadow: hasPendingReminders ? undefined : 'var(--card-shadow)'
        }}
      >
        {/* Accent Top Border Stripe */}
        <div 
          className={`h-1 w-full ${
            hasPendingReminders 
              ? 'bg-[var(--accent)]' 
              : 'bg-gradient-to-r from-[var(--ink-faint)] via-[var(--accent)]/70 to-[var(--ink-faint)]'
          }`} 
        />

        {/* Digest Header Bar */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ink-faint)]">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${
              hasPendingReminders
                ? 'bg-[var(--surface-card)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-[var(--surface-card)] border-[var(--ink-faint)] text-[var(--accent)]'
            }`}>
              {hasPendingReminders ? (
                <Bell className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif text-lg sm:text-xl font-normal text-[var(--ink)]">
                  {hasPendingReminders ? 'Active Commitments & Upcoming Deadlines' : 'Daily Motivation & Cognitive Reflection'}
                </h3>
                {hasPendingReminders ? (
                  <span
                    id="all-clear-pending-badge"
                    role="button"
                    tabIndex={0}
                    onClick={handleClearAllContent}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClearAllContent(); }}
                    className="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 shadow-xs hover:bg-[var(--accent)]/25 hover:border-[var(--accent)]/50 transition-all cursor-pointer select-none inline-flex items-center space-x-1"
                    title="Click to mark all commitments as clear"
                  >
                    <span>{activeRemindersCount} PENDING</span>
                  </span>
                ) : (
                  <span
                    id="all-clear-btn"
                    role="button"
                    tabIndex={0}
                    onClick={handleClearAllContent}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClearAllContent(); }}
                    className={`px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full border shadow-xs transition-all cursor-pointer select-none inline-flex items-center space-x-1 ${
                      isContentCleared
                        ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-500/60'
                        : 'bg-[var(--surface-card)] text-[var(--ink-muted)] hover:text-rose-500 hover:border-rose-500/40 border-[var(--ink-faint)] hover:bg-rose-500/10 active:scale-95'
                    }`}
                    title={isContentCleared ? 'Click to restore digest content' : 'Click to clear respective digest content'}
                  >
                    {isContentCleared ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-500 mr-0.5" />
                        <span>CLEARED</span>
                      </>
                    ) : (
                      <>
                        <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100 mr-0.5" />
                        <span>ALL CLEAR</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-wider flex items-center space-x-2 mt-0.5">
                <span>GEMINI 3.6 FLASH • {digest.analyzedEntriesCount || totalEntriesCount} ENTRIES ANALYZED</span>
                <span>•</span>
                <span>{new Date(digest.lastAnalyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--ink-faint)] transition-all cursor-pointer shadow-xs"
              title="Re-analyze Journal Entries"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[var(--accent)]' : ''}`} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--ink-faint)] transition-all cursor-pointer shadow-xs"
              title={isCollapsed ? 'Expand digest' : 'Collapse digest'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--ink-faint)] transition-all cursor-pointer shadow-xs"
              title="Dismiss digest"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        {!isCollapsed && (
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* 1. If Reminders Exist: Show Reminder Cards */}
            {hasPendingReminders && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {digest.reminders.map((item: ReminderTask) => {
                    const isDone = completedTaskIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-xl transition-all shadow-sm hover:shadow-md ${
                          isDone
                            ? 'bg-[var(--surface-card)]/40 border-[var(--ink-faint)] opacity-50'
                            : item.urgency === 'high'
                            ? 'bg-[var(--surface-card)] border-rose-500/40 hover:border-rose-400'
                            : 'bg-[var(--surface-card)] border-[var(--ink-faint)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5">
                            <button
                              onClick={() => onToggleTaskComplete && onToggleTaskComplete(item.id)}
                              className="mt-0.5 text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                              title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                              ) : (
                                <Circle className="w-4 h-4 text-[var(--ink-muted)] hover:text-[var(--accent)]" />
                              )}
                            </button>
                            <div>
                              <p className={`text-sm font-medium ${isDone ? 'line-through text-[var(--ink-muted)]' : 'text-[var(--ink)]'}`}>
                                {item.task}
                              </p>
                              {item.context && (
                                <p className="text-xs text-[var(--ink-muted)] font-light mt-1 italic line-clamp-1">
                                  "{item.context}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Urgency Badge */}
                          <div className="flex flex-col items-end space-y-1">
                            {item.urgency === 'high' && (
                              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-md bg-rose-950/70 text-rose-300 border border-rose-800/50 shadow-xs">
                                URGENT
                              </span>
                            )}
                            {item.targetDate && (
                              <span className="flex items-center space-x-1 text-[10px] text-[var(--accent)] font-mono">
                                <Clock className="w-3 h-3" />
                                <span>{item.targetDate}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick action: Reflect on this item */}
                        {!isDone && onSelectPrompt && (
                          <div className="mt-3 pt-2.5 border-t border-[var(--ink-faint)] flex items-center justify-between">
                            <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                              FROM: {item.sourceEntryTitle || 'PAST ENTRY'}
                            </span>
                            <button
                              onClick={() => onSelectPrompt(`Reflect on my progress with: "${item.task}" (Target: ${item.targetDate || 'Upcoming'}). How can I approach this mindfully?`)}
                              className="inline-flex items-center space-x-1 text-xs font-mono text-[var(--accent)] hover:underline font-medium transition-colors cursor-pointer"
                            >
                              <span>[ REFLECT ON GOAL ]</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Motivational perspective companion */}
                {digest.motivation?.message && (
                  <div className="bg-[var(--surface-card)] p-4 border border-[var(--ink-faint)] rounded-xl shadow-sm flex items-start space-x-3">
                    <Flame className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-[var(--ink)] font-light leading-relaxed">
                      <span className="font-mono text-xs uppercase font-bold text-[var(--accent)] tracking-wider mr-1">COGNITIVE PERSPECTIVE:</span>
                      {digest.motivation.message}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. If No Active Reminders: Show Rich Personalized Motivation & Spark OR Cleared State */}
            {!hasPendingReminders && (
              isContentCleared ? (
                <div 
                  id="digest-cleared-content-view"
                  className="bg-[var(--surface-card)] p-6 border border-[var(--ink-faint)] rounded-xl shadow-sm text-center space-y-3"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-medium text-[var(--ink)]">
                      Digest Content Cleared
                    </h4>
                    <p className="text-xs text-[var(--ink-muted)] font-light mt-1 max-w-md mx-auto leading-relaxed">
                      The daily reflection quote, cognitive focus area, and journaling prompt have been cleared from this card.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center space-x-3">
                    <button
                      id="restore-cleared-content-btn"
                      onClick={() => {
                        setIsContentCleared(false);
                        onToast?.('Daily digest content restored.', 'info');
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[var(--accent)] hover:bg-[var(--surface)] border border-[var(--ink-faint)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESTORE CONTENT</span>
                    </button>
                    <button
                      id="refresh-cleared-content-btn"
                      onClick={() => {
                        setIsContentCleared(false);
                        onRefresh();
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-[var(--ink)] bg-[var(--surface)] hover:bg-[var(--surface-card)] border border-[var(--ink-faint)] transition-all cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>GENERATE NEW SPARK</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Philosophical Quote & Message */}
                  <div className="bg-[var(--surface-card)] p-5 border border-[var(--ink-faint)] rounded-xl shadow-sm">
                    {digest.motivation?.quote && (
                      <blockquote className="font-serif italic text-base sm:text-lg text-[var(--ink)] border-l-2 border-[var(--accent)] pl-4 mb-3">
                        "{digest.motivation.quote}"
                      </blockquote>
                    )}
                    <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-light leading-relaxed">
                      {digest.motivation?.message}
                    </p>
                    
                    {digest.motivation?.focusArea && (
                      <div className="mt-4 flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-wider font-semibold">TODAY'S FOCUS:</span>
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-mono font-medium rounded-lg bg-[var(--surface)] text-[var(--accent)] border border-[var(--ink-faint)] shadow-xs">
                          <Compass className="w-3.5 h-3.5" />
                          <span>{digest.motivation.focusArea}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Journaling Spark */}
                  {digest.motivation?.journalingPrompt && onSelectPrompt && (
                    <div className="bg-[var(--surface-card)] p-4 border border-[var(--accent)]/30 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[var(--accent)]">
                          [ DAILY JOURNALING SPARK ]
                        </span>
                        <p className="font-serif italic text-sm sm:text-base text-[var(--ink)] font-normal">
                          "{digest.motivation.journalingPrompt}"
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectPrompt(digest.motivation.journalingPrompt!)}
                        className="shrink-0 btn-cyber flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--bg)] border border-[var(--ink)] hover:border-[var(--accent)] font-mono text-xs font-medium uppercase tracking-wider transition-all cursor-pointer hover:shadow-xl shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Write on this topic</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            )}

          </div>
        )}
      </div>
    </div>
  );
};

