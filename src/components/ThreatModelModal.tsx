import React from 'react';
import { ShieldCheck, X, Lock, CheckCircle2, Server, Key, Database, Cpu, Terminal } from 'lucide-react';
import { ThreatModelZone } from '../types';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THREAT_MODEL_DATA: ThreatModelZone[] = [
  {
    zone: 'Zone 1: Input Surfaces',
    threat: 'Malformed JSON payloads, oversized prompt injection, NoSQL injection attempts.',
    countermeasure: 'Strict defensive payload destructuring, schema type checking, and length bounds in server.ts and Firestore sanitization.',
    status: 'enforced',
  },
  {
    zone: 'Zone 2: Planning & Reasoning',
    threat: 'Indirect Prompt Injection attempting to override system persona or bypass safety.',
    countermeasure: 'Deliberate persona framing separating user journal content from system directives; input treated strictly as data.',
    status: 'enforced',
  },
  {
    zone: 'Zone 3: Tool Execution & APIs',
    threat: 'API Key exposure, model unavailability, or unhandled 503/429 rate limit exceptions.',
    countermeasure: 'Zero keys sent to browser. Resilient fallback ladder: gemini-3.6-flash -> gemini-3.1-flash-lite -> gemini-flash-latest -> gemini-3.7-flash.',
    status: 'enforced',
  },
  {
    zone: 'Zone 4: Memory & State (Firestore)',
    threat: 'Cross-user data leakage or unauthorized document access across accounts.',
    countermeasure: 'Owner-bound path checking (/users/{userId}/entries/{id}) with deployed firestore.rules validating request.auth.uid == userId.',
    status: 'enforced',
  },
  {
    zone: 'Zone 5: Inter-System Communication',
    threat: 'Hardcoded credentials in source control or unencrypted transit.',
    countermeasure: 'Google Cloud Secret Manager & environment variable dynamic injection; zero hardcoded secrets in repository.',
    status: 'enforced',
  },
];

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-[var(--surface)] border border-[var(--ink-faint)] max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col transition-all"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--ink-faint)] flex items-center justify-between sticky top-0 bg-[var(--surface)] z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--surface-card)] border border-[var(--accent)]/40 rounded-xl flex items-center justify-center text-[var(--accent)] shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-normal text-[var(--ink)]">
                Agentic Threat Model & Security Specification
              </h2>
              <p className="text-xs font-mono text-[var(--ink-muted)]">
                [ OWASP TOP 10 & 5 THREAT ZONES COMPLIANCE ANALYSIS ]
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-card)] transition-colors cursor-pointer border border-transparent hover:border-[var(--ink-faint)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs text-[var(--ink)]">
          
          {/* Summary Table */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              // THE 5 SECURITY THREAT ZONES MATRIX
            </h3>
            
            <div className="overflow-x-auto border border-[var(--ink-faint)]">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[var(--surface-card)] border-b border-[var(--ink-faint)] text-[11px] text-[var(--ink-muted)] uppercase">
                    <th className="p-3 font-semibold">Zone</th>
                    <th className="p-3 font-semibold">Identified Threat</th>
                    <th className="p-3 font-semibold">Implemented Countermeasure</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-faint)]">
                  {THREAT_MODEL_DATA.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--surface-card)]/50">
                      <td className="p-3 font-semibold text-[var(--ink)] whitespace-nowrap">
                        {item.zone}
                      </td>
                      <td className="p-3 text-[var(--ink-muted)] font-sans text-xs">
                        {item.threat}
                      </td>
                      <td className="p-3 text-[var(--ink)] font-sans text-xs">
                        {item.countermeasure}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[var(--surface-card)] border border-emerald-500/40 text-emerald-400 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ENFORCED</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Firestore Security Rules Block */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--ink)] flex items-center space-x-1.5 uppercase">
                <Database className="w-4 h-4 text-[var(--accent)]" />
                <span>Deployed Cloud Firestore Security Rules</span>
              </h3>
              <span className="text-[10px] text-[var(--accent)] bg-[var(--surface-card)] px-2 py-0.5 border border-[var(--accent)]/30">
                OWNER-BOUND
              </span>
            </div>
            <pre className="bg-[var(--bg)] p-4 border border-[var(--ink-faint)] font-mono text-[11px] text-[var(--ink)] overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{allUserPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
            </pre>
          </div>

          {/* Secret Manager Integration */}
          <div className="space-y-2 font-mono">
            <h3 className="text-xs font-semibold text-[var(--ink)] flex items-center space-x-1.5 uppercase">
              <Key className="w-4 h-4 text-[var(--accent)]" />
              <span>Google Cloud Secret Manager & Environment Variable Binding</span>
            </h3>
            <p className="text-[var(--ink-muted)] text-[11px] leading-relaxed font-sans">
              API keys are never compiled into frontend JavaScript bundles. In production on Cloud Run, secrets are accessed securely via Secret Manager bindings or standard container environment injection:
            </p>
            <div className="bg-[var(--bg)] p-3.5 border border-[var(--ink-faint)] font-mono text-[11px] text-[var(--ink)]">
              <code>process.env.GEMINI_API_KEY</code> &rarr; Initialized lazily via server-side proxy
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--ink-faint)] bg-[var(--surface)] flex justify-end">
          <button
            onClick={onClose}
            className="btn-cyber px-4 py-2 bg-[var(--ink)] text-[var(--bg)] font-mono text-xs font-semibold uppercase tracking-wider border border-[var(--ink)] hover:border-[var(--accent)] cursor-pointer"
          >
            Close Security Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
