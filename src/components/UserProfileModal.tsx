import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  MapPin, 
  Globe, 
  Copy, 
  Check, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  RefreshCw, 
  Lock, 
  Radio,
  ExternalLink,
  Fingerprint
} from 'lucide-react';
import { AuthUser, SessionLocationInfo } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  onSignOut?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
}) => {
  const [sessionInfo, setSessionInfo] = useState<SessionLocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // 1. Fetch primary session data from server endpoint
      const res = await fetch('/api/session-info');
      let data: SessionLocationInfo;
      if (res.ok) {
        data = await res.json();
      } else {
        throw new Error('Server session discovery failed');
      }

      // 2. If server returns local loopback or generic IP, attempt public client-side IP discovery as fallback
      if (!data.ip || data.ip.includes('127.0.0.1') || data.ip === '::1' || data.ip.includes('Local')) {
        try {
          const clientIpRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2500) });
          if (clientIpRes.ok) {
            const clientIpData = await clientIpRes.json();
            if (clientIpData?.ip) {
              data.ip = clientIpData.ip;
              // Try location lookup for this public IP
              try {
                const geoRes = await fetch(`https://ipapi.co/${clientIpData.ip}/json/`, { signal: AbortSignal.timeout(2500) });
                if (geoRes.ok) {
                  const geoData = await geoRes.json();
                  if (geoData.city) data.city = geoData.city;
                  if (geoData.region) data.region = geoData.region;
                  if (geoData.country_name) data.country = geoData.country_name;
                  if (geoData.country_code) data.countryCode = geoData.country_code;
                  if (geoData.timezone) data.timezone = geoData.timezone;
                }
              } catch {
                // Ignore geo fallback error
              }
            }
          }
        } catch {
          // Ignore client public discovery error
        }
      }

      setSessionInfo(data);
    } catch (err: any) {
      console.warn('Session info fetch error:', err);
      // Construct fallback session info using browser capabilities
      setSessionInfo({
        ip: 'Connected Gateway',
        city: 'Local Client',
        country: 'Online',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        timestamp: Date.now()
      });
      setFetchError('Using fallback diagnostic info');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSessionData();
    }
  }, [isOpen, fetchSessionData]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isDemo = !!user.isDemo;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[var(--surface-card)] border-[1.5px] border-[var(--ink-faint)] rounded-2xl shadow-2xl p-6 text-[var(--ink)] overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
        id="user-profile-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--ink-faint)]">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border-[1.5px] ${isDemo ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'}`}>
              {isDemo ? <Radio className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[var(--ink)] leading-tight">
                {isDemo ? 'Sandbox Session Profile' : 'Account & Session Info'}
              </h3>
              <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                {isDemo ? 'Preview Environment' : 'Verified Google Account'}
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--ink-faint)] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-4 space-y-4">

          {/* SANDBOX PREVIEW MODE: Display IP address only as requested */}
          {isDemo ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left">
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    SANDBOX_PREVIEW
                  </span>
                  <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                    Isolated Sandbox Mode
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  You are currently previewing Daybook in sandbox mode. Personal user credentials (name and email) are omitted. Only your network IP address is captured for diagnostic isolation.
                </p>
              </div>

              {/* IP Address Card */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--ink-faint)] text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Current IP Address</span>
                  </span>
                  {sessionInfo?.ip && (
                    <button
                      id="copy-sandbox-ip-btn"
                      onClick={() => copyToClipboard(sessionInfo.ip, 'sandbox-ip')}
                      className="flex items-center space-x-1 font-mono text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
                      title="Copy IP Address"
                    >
                      {copiedField === 'sandbox-ip' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {isLoading ? (
                    <div className="flex items-center space-x-2 text-xs font-mono text-[var(--ink-muted)]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                      <span>Discovering IP address...</span>
                    </div>
                  ) : (
                    <span className="font-mono text-base font-bold tracking-tight text-[var(--ink)]">
                      {sessionInfo?.ip || '127.0.0.1 (Local)'}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* GOOGLE SIGNED-IN MODE: Full User details + Location + IP address */
            <div className="space-y-3.5">
              {/* User Avatar, Name & Email */}
              <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--ink-faint)] text-left">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-12 h-12 rounded-full border-[1.5px] border-[var(--accent)] object-cover shadow-sm ring-2 ring-[var(--accent)]/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-card)] border-[1.5px] border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-lg font-mono font-bold shadow-sm">
                    {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-6 h-6" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-sm text-[var(--ink)] truncate">
                      {user.displayName || 'Google Account User'}
                    </h4>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      GOOGLE
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-[var(--ink-muted)] truncate mt-0.5">
                    <Mail className="w-3 h-3 text-[var(--accent)] shrink-0" />
                    <span className="truncate">{user.email || 'No email attached'}</span>
                  </div>
                </div>
              </div>

              {/* Login Location ("from where user login") */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--ink-faint)] text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Login Location</span>
                  </span>
                  {sessionInfo?.city && (
                    <span className="text-[10px] font-mono text-[var(--accent)]">
                      {sessionInfo.countryCode || 'GEO'}
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  {isLoading ? (
                    <div className="flex items-center space-x-2 text-xs font-mono text-[var(--ink-muted)]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                      <span>Resolving geographic coordinates...</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {[sessionInfo?.city, sessionInfo?.region, sessionInfo?.country]
                          .filter(Boolean)
                          .join(', ') || 'Connected Region'}
                      </p>
                      {sessionInfo?.timezone && (
                        <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                          {sessionInfo.timezone}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* IP Address Card */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--ink-faint)] text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>IP Address</span>
                  </span>
                  {sessionInfo?.ip && (
                    <button
                      id="copy-ip-btn"
                      onClick={() => copyToClipboard(sessionInfo.ip, 'auth-ip')}
                      className="flex items-center space-x-1 font-mono text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
                      title="Copy IP Address"
                    >
                      {copiedField === 'auth-ip' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-1">
                  {isLoading ? (
                    <div className="flex items-center space-x-2 text-xs font-mono text-[var(--ink-muted)]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                      <span>Detecting client IP...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[var(--ink)] tracking-tight">
                        {sessionInfo?.ip || '127.0.0.1 (Local)'}
                      </span>
                      {sessionInfo?.org && (
                        <span className="text-[10px] font-mono text-[var(--ink-muted)] truncate max-w-[150px]" title={sessionInfo.org}>
                          {sessionInfo.org}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* User UID & Vault Isolation Status */}
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--ink-faint)] text-left flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <Fingerprint className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                      User Identifier
                    </p>
                    <p className="font-mono text-xs text-[var(--ink)] truncate max-w-[200px]">
                      {user.uid}
                    </p>
                  </div>
                </div>
                <button
                  id="copy-uid-btn"
                  onClick={() => copyToClipboard(user.uid, 'uid')}
                  className="p-1.5 rounded text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
                  title="Copy UID"
                >
                  {copiedField === 'uid' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Security Shield Banner */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-left">
                <Lock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="font-mono text-[10px] text-[var(--accent)]">
                  Owner-Bound Cloud Firestore Isolation Enforced
                </span>
              </div>
            </div>
          )}

          {fetchError && (
            <p className="font-mono text-[10px] text-amber-500 text-left">
              * {fetchError}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[var(--ink-faint)] flex items-center justify-between">
          <button
            id="refresh-session-info-btn"
            onClick={fetchSessionData}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] border border-[var(--ink-faint)] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh location and IP"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--accent)]' : ''}`} />
            <span>REFRESH</span>
          </button>

          <div className="flex items-center space-x-2">
            {onSignOut && (
              <button
                id="modal-signout-btn"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="px-3 py-1.5 rounded-lg font-mono text-[11px] text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer"
              >
                SIGN_OUT
              </button>
            )}
            <button
              id="close-profile-btn"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg font-mono text-[11px] font-semibold bg-[var(--ink)] text-[var(--bg)] hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
