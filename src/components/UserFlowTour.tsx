import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  Compass, 
  FileText, 
  Save, 
  User, 
  Lightbulb, 
  ArrowRight
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  badge: string;
  description: string;
  hint?: string;
  icon: React.ReactNode;
}

interface UserFlowTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'step-digest',
    targetId: 'ai-daily-digest-card',
    badge: 'STEP 1 OF 5 • PROACTIVE AI',
    title: 'AI Daily Digest & Smart Deadlines',
    description: 'Daybook scans your entries to identify upcoming deadlines, tasks, and commitments. When your schedule is clear, it provides inspirational quotes, cognitive focus areas, and daily sparks.',
    hint: 'Tip: You can click the "ALL CLEAR" badge in the digest card anytime to clear or restore the content.',
    icon: <Sparkles className="w-4 h-4 text-[var(--accent)]" />
  },
  {
    id: 'step-editor',
    targetId: 'journal-editor-container',
    badge: 'STEP 2 OF 5 • REFLECTION VAULT',
    title: 'Private Journal & Tone Selector',
    description: 'Capture your thoughts, give your reflection a title, and select a cognitive tone (Reflective, Grateful, Ambitious, Seeking Clarity). Click [EXTRACT TAGS] to let Gemini automatically summarize core themes.',
    hint: 'Your thoughts in Sandbox Preview are securely isolated in your private local browser vault.',
    icon: <FileText className="w-4 h-4 text-blue-400" />
  },
  {
    id: 'step-gemini',
    targetId: 'gemini-reflection-core',
    badge: 'STEP 3 OF 5 • COGNITIVE DIALOGUE',
    title: 'Gemini Reflection Core & 5 Modes',
    description: 'Converse with Gemini across 5 specialized reflection modes: Deep Reflection, Summary & Synthesis, Brainstorm Ideas, Action Plan, or Deep Questions to gain perspective and clarity.',
    hint: 'The engine uses an automated multi-model fallback ladder for zero downtime.',
    icon: <Compass className="w-4 h-4 text-amber-400" />
  },
  {
    id: 'step-save',
    targetId: 'btn-save-firestore',
    badge: 'STEP 4 OF 5 • DATA INTEGRITY',
    title: 'Verified Vault Persistence',
    description: 'Click "SAVE REFLECTION" to store your entries. All payloads undergo strict undefined-stripping to guarantee transaction verification and data hygiene.',
    hint: 'In Google Sign-In mode, this persists to Firestore; in Sandbox, it saves to your local vault.',
    icon: <Save className="w-4 h-4 text-emerald-400" />
  },
  {
    id: 'step-profile',
    targetId: 'nav-profile-btn',
    badge: 'STEP 5 OF 5 • SECURITY & IDENTITY',
    title: 'Profile Diagnostics & Vault History',
    description: 'Click your profile avatar anytime to view your network IP address and security isolation context. Click History in the navigation to browse or search past reflections.',
    hint: 'You can relaunch this interactive tour at any time by clicking the "GUIDE" button in the top bar.',
    icon: <User className="w-4 h-4 text-purple-400" />
  }
];

export const UserFlowTour: React.FC<UserFlowTourProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Update target rect coordinates
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const targetElement = document.getElementById(currentStep.targetId);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
      // Smoothly scroll target into view if partially offscreen
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetPosition();

    const handleResize = () => updateTargetPosition();
    const handleScroll = () => {
      const targetElement = document.getElementById(currentStep.targetId);
      if (targetElement) {
        setTargetRect(targetElement.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <div 
      id="user-flow-tour-modal"
      className="fixed inset-0 z-50 pointer-events-none transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
    >
      {/* Semi-transparent backdrop overlay with subtle blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Target Element Spotlight Highlight Ring */}
      {targetRect && (
        <div
          className="absolute pointer-events-none rounded-2xl border-2 border-[var(--accent)] transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.45),0_0_35px_rgba(var(--accent-rgb),0.6)] animate-pulse"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* Floating Guided Pop-up Tooltip Card */}
      <div className="absolute inset-x-0 bottom-6 sm:bottom-10 pointer-events-none flex justify-center px-4">
        <div 
          className="pointer-events-auto w-full max-w-lg bg-[var(--surface)] text-[var(--ink)] border border-[var(--accent)]/50 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-md relative overflow-hidden transition-all duration-300"
          style={{
            boxShadow: '0 15px 40px var(--accent-glow), 0 0 0 1px var(--ink-faint)'
          }}
        >
          {/* Top Progress Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--ink-faint)]">
            <div 
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Header Row: Badge & Close Button */}
          <div className="flex items-center justify-between gap-3 mb-2.5 pt-1">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-[var(--surface-card)] border border-[var(--accent)]/30 flex items-center justify-center shadow-xs">
                {currentStep.icon}
              </div>
              <span className="font-mono text-[10px] font-bold tracking-widest text-[var(--accent)] uppercase">
                {currentStep.badge}
              </span>
            </div>

            <button
              id="tour-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
              title="Close Guide (Esc)"
              aria-label="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <h3 
            id="tour-step-title" 
            className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)] mb-2"
          >
            {currentStep.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-light leading-relaxed mb-3">
            {currentStep.description}
          </p>

          {/* Useful Tip Box */}
          {currentStep.hint && (
            <div className="mb-4 p-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--ink-faint)] text-[11px] font-mono text-[var(--ink-muted)] flex items-start space-x-2">
              <span className="text-[var(--accent)] font-bold shrink-0">💡</span>
              <p className="leading-normal">{currentStep.hint}</p>
            </div>
          )}

          {/* Footer Controls: Dots, Previous, Next / Finish */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--ink-faint)]">
            
            {/* Step Dots Indicator */}
            <div className="flex items-center space-x-1.5">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-[var(--accent)]'
                      : idx < currentStepIndex
                      ? 'bg-[var(--accent)]/50 hover:bg-[var(--accent)]'
                      : 'bg-[var(--ink-faint)] hover:bg-[var(--ink-muted)]'
                  }`}
                  title={`Jump to step ${idx + 1}`}
                  aria-label={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              {currentStepIndex > 0 && (
                <button
                  id="tour-prev-btn"
                  onClick={handlePrev}
                  className="btn-cyber px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-[var(--ink)] bg-transparent hover:bg-[var(--surface-card)] border border-[var(--ink-faint)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
              )}

              <button
                id="tour-next-btn"
                onClick={handleNext}
                className="btn-cyber px-4 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[var(--ink)] text-[var(--bg)] border border-[var(--ink)] hover:border-[var(--accent)] transition-all cursor-pointer shadow-md flex items-center space-x-1.5 hover:scale-105 active:scale-95"
              >
                {isLastStep ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                    <span>Get Started</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
