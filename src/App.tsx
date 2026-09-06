/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  formatAuthUser, 
  fetchUserJournalEntries 
} from './lib/firebase';
import { AuthUser, JournalEntry, ReminderAnalysisResult } from './types';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { JournalEditor } from './components/JournalEditor';
import { EntryHistory } from './components/EntryHistory';
import { ThreatModelModal } from './components/ThreatModelModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { DailyDigestBanner } from './components/DailyDigestBanner';
import { UserProfileModal } from './components/UserProfileModal';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [activeView, setActiveView] = useState<'editor' | 'history'>('editor');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [initialTitle, setInitialTitle] = useState<string>('');

  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const toggleTheme = () => {
    setIsLightMode((prev) => !prev);
  };

  // AI Reminder & Motivation Engine State
  const [digest, setDigest] = useState<ReminderAnalysisResult | null>(null);
  const [isAnalyzingReminders, setIsAnalyzingReminders] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('daybook_completed_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const hasAnalyzedOnLogin = useRef<string | null>(null);

  // Toast helper
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Run AI Reminder & Motivation Engine Analysis
  const runReminderAnalysis = useCallback(async (userEntries: JournalEntry[], isManual: boolean = false) => {
    setIsAnalyzingReminders(true);
    try {
      const response = await fetch('/api/gemini/analyze-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: userEntries,
          currentDate: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: ReminderAnalysisResult = await response.json();
      setDigest(data);

      if (data.hasReminders && data.reminders.length > 0) {
        const pendingCount = data.reminders.filter(r => !completedTaskIds.includes(r.id)).length;
        if (pendingCount > 0) {
          showToast(`AI Reminder: You have ${pendingCount} upcoming commitment${pendingCount > 1 ? 's' : ''} from your journal entries.`, 'info');
        }
      } else if (data.motivation?.message && (isManual || userEntries.length > 0)) {
        showToast(`✨ Daybook Reflection: "${data.motivation.focusArea || 'Growth'}" — ${data.motivation.quote || 'Keep reflecting!'}`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to analyze reminders:', err);
      if (isManual) {
        showToast('Notice: Could not refresh AI reminders right now. Retrying on next reflection.', 'info');
      }
    } finally {
      setIsAnalyzingReminders(false);
    }
  }, [completedTaskIds, showToast]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const formatted = formatAuthUser(firebaseUser);
        setUser(formatted);
        if (formatted) {
          loadUserEntries(formatted.uid);
        }
      } else {
        // Check if demo user is stored in session
        const storedDemo = sessionStorage.getItem('daybook_demo_user');
        if (storedDemo) {
          try {
            const demoUser = JSON.parse(storedDemo) as AuthUser;
            setUser(demoUser);
            loadUserEntries(demoUser.uid);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user journal entries from Firestore
  const loadUserEntries = async (userId: string) => {
    try {
      const userEntries = await fetchUserJournalEntries(userId);
      setEntries(userEntries);
      
      // Auto-trigger Reminder & Motivation analysis on login for this user
      if (hasAnalyzedOnLogin.current !== userId) {
        hasAnalyzedOnLogin.current = userId;
        runReminderAnalysis(userEntries, false);
      }
    } catch (err: any) {
      console.warn('Notice loading user entries:', err?.message || err);
      // Fallback to local cached vault if available
      try {
        const localKey = `daybook_local_entries_${userId}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setEntries(parsed);
          return;
        }
      } catch {
        // ignore
      }
      showToast('Vault ready. Start journaling or explore reflections.', 'info');
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const signedInUser = await loginWithGoogle();
      setUser(signedInUser);
      sessionStorage.removeItem('daybook_demo_user');
      showToast(`Welcome back, ${signedInUser.displayName || 'Journaler'}!`, 'success');
      hasAnalyzedOnLogin.current = null;
      loadUserEntries(signedInUser.uid);
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('popup-closed-by-user')) {
        // User closed the popup intentionally or dismissed the dialog
        console.info('Google Sign-In popup closed by user.');
        showToast('Google Sign-In cancelled. You can try again or explore with the Sandbox Vault.', 'info');
      } else if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        console.warn('Google Sign-In popup blocked by browser.');
        setAuthError('Sign-in popup was blocked by browser. Please enable popups or use Sandbox Vault.');
        showToast('Pop-up window was blocked. Please allow pop-ups or use Sandbox Vault.', 'error');
      } else if (errorCode === 'auth/cancelled-popup-request') {
        console.info('Sign-in popup request cancelled.');
      } else {
        console.error('Google Sign-In Error:', err);
        setAuthError(errorMessage || 'Failed to sign in with Google');
        showToast('Authentication failed. You can explore with the Sandbox Vault below.', 'error');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Demo Sandbox Sign-In for iframe environments
  const handleDemoSignIn = () => {
    const demoUser: AuthUser = {
      uid: 'daybook_sandbox_vault_user',
      displayName: 'Daybook Explorer',
      email: 'explorer@daybook.app',
      photoURL: null,
      isDemo: true,
    };
    setUser(demoUser);
    sessionStorage.setItem('daybook_demo_user', JSON.stringify(demoUser));
    showToast('Signed in to isolated Daybook Vault.', 'success');
    hasAnalyzedOnLogin.current = null;
    loadUserEntries(demoUser.uid);
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await logoutUser();
      sessionStorage.removeItem('daybook_demo_user');
      setUser(null);
      setEntries([]);
      setSelectedEntry(null);
      setDigest(null);
      hasAnalyzedOnLogin.current = null;
      setActiveView('editor');
      showToast('Successfully signed out.', 'info');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Entry updates
  const handleEntrySaved = (savedEntry: JournalEntry) => {
    setSelectedEntry(savedEntry);
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === savedEntry.id);
      const updated = exists ? prev.map((e) => (e.id === savedEntry.id ? savedEntry : e)) : [savedEntry, ...prev];
      return updated;
    });
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setInitialPrompt('');
    setInitialTitle('');
    setActiveView('editor');
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setInitialPrompt('');
    setInitialTitle('');
    setActiveView('editor');
  };

  const handleEntryDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    if (selectedEntry?.id === deletedId) {
      setSelectedEntry(null);
    }
  };

  // Prompt or Goal selected from AI Reminder/Motivation Engine
  const handleSelectPromptFromDigest = (promptText: string) => {
    setSelectedEntry(null);
    setInitialPrompt(promptText);
    setInitialTitle(`Reflection: ${promptText.slice(0, 40)}...`);
    setActiveView('editor');
    showToast('Loaded AI prompt spark into Daybook editor.', 'info');
  };

  // Toggle task completed state
  const handleToggleTaskComplete = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const isAlreadyDone = prev.includes(taskId);
      const next = isAlreadyDone ? prev.filter(id => id !== taskId) : [...prev, taskId];
      try {
        localStorage.setItem('daybook_completed_tasks', JSON.stringify(next));
      } catch (e) {
        console.warn('Could not persist completed tasks to localStorage:', e);
      }
      showToast(isAlreadyDone ? 'Task marked active.' : 'Task completed! Keep up the momentum.', 'success');
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col font-sans selection:bg-[var(--accent)]/30 selection:text-[var(--accent)] transition-colors duration-200">
      
      {/* Navigation Header */}
      <Navbar
        user={user}
        activeView={activeView}
        onViewChange={setActiveView}
        onNewEntry={handleNewEntry}
        onOpenThreatModel={() => setIsThreatModelOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSignOut={handleSignOut}
        isLightMode={isLightMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Body */}
      <main className="flex-1 pb-10">
        {!user ? (
          <LandingHero
            onGoogleSignIn={handleGoogleSignIn}
            onDemoSignIn={handleDemoSignIn}
            isLoading={isAuthLoading}
            authError={authError}
            onOpenThreatModel={() => setIsThreatModelOpen(true)}
            isLightMode={isLightMode}
            onToggleTheme={toggleTheme}
          />
        ) : (
          <>
            {/* AI Reminder & Motivation Engine Banner (Auto-reviewed on login) */}
            <DailyDigestBanner
              digest={digest}
              isLoading={isAnalyzingReminders}
              onRefresh={() => runReminderAnalysis(entries, true)}
              onSelectPrompt={handleSelectPromptFromDigest}
              onToggleTaskComplete={handleToggleTaskComplete}
              completedTaskIds={completedTaskIds}
              totalEntriesCount={entries.length}
            />

            {/* Main Journal Editor */}
            <JournalEditor
              user={user}
              entry={selectedEntry}
              initialPrompt={initialPrompt}
              initialTitle={initialTitle}
              onEntrySaved={handleEntrySaved}
              onToast={showToast}
            />

            {/* History Pop-Up Page Modal Overlay */}
            {activeView === 'history' && (
              <div
                id="history-modal-overlay"
                role="dialog"
                aria-modal="true"
                aria-label="Journal History Archive"
                className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-200"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setActiveView('editor');
                  }
                }}
              >
                <div className="w-full max-w-7xl my-auto animate-in zoom-in-95 duration-200">
                  <EntryHistory
                    user={user}
                    entries={entries}
                    onSelectEntry={(entry) => {
                      handleSelectEntry(entry);
                      setActiveView('editor');
                    }}
                    onNewEntry={() => {
                      handleNewEntry();
                      setActiveView('editor');
                    }}
                    onEntryDeleted={handleEntryDeleted}
                    onToast={showToast}
                    onBackToEditor={() => setActiveView('editor')}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Threat Model Modal */}
      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
      />

      {/* User Profile & Session Diagnostics Modal */}
      {user && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onSignOut={handleSignOut}
        />
      )}

      {/* Global Notifications Toast Container */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

