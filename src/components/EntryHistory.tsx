import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  X,
  Sparkles, 
  Tag, 
  Calendar, 
  MessageSquare, 
  Download, 
  Smile, 
  PlusCircle,
  FileText
} from 'lucide-react';
import { JournalEntry, AuthUser } from '../types';
import { removeJournalEntry } from '../lib/firebase';

interface EntryHistoryProps {
  user: AuthUser;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onEntryDeleted: (deletedId: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onBackToEditor?: () => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  user,
  entries,
  onSelectEntry,
  onNewEntry,
  onEntryDeleted,
  onToast,
  onBackToEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Close history on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBackToEditor) {
        onBackToEditor();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToEditor]);

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;

      return matchesSearch && matchesMood;
    });
  }, [entries, searchQuery, selectedMood]);

  const handleDelete = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this reflection? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(entryId);
      await removeJournalEntry(user.uid, entryId);
      onEntryDeleted(entryId);
      onToast('Entry removed from Firestore.', 'success');
    } catch (err: any) {
      console.error('Delete error:', err);
      onToast(`Failed to delete entry: ${err?.message || 'Database error'}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportEntry = (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const mdContent = `# ${entry.title || 'Untitled Reflection'}
Date: ${new Date(entry.createdAt).toLocaleString()}
Mood: ${entry.mood || 'Reflective'}
Tags: ${entry.tags?.join(', ') || 'none'}

## Journal Entry
${entry.content}

${entry.summary ? `## Executive Summary\n${entry.summary}\n` : ''}

${entry.interactions && entry.interactions.length > 0 ? `## Gemini Reflections & Dialogue\n` : ''}
${(entry.interactions || [])
  .map(
    (i) =>
      `### ${i.role === 'user' ? 'User Prompt' : 'Gemini Reflection'} (${new Date(i.timestamp).toLocaleTimeString()})\n${i.text}\n`
  )
  .join('\n')}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date(entry.createdAt).toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Exported reflection as Markdown file.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] p-6 space-y-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {onBackToEditor && (
              <button
                id="history-back-btn"
                onClick={onBackToEditor}
                className="btn-cyber flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface)] text-[var(--ink)] border-[1.5px] border-[var(--ink-faint)] hover:border-[var(--accent)] font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer hover:shadow-md shrink-0 shadow-sm"
                title="Return to Journal Editor"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-semibold">Back to Journal</span>
              </button>
            )}
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[var(--ink)]">
                Reflection Archive & Journal History
              </h2>
              <p className="text-xs font-mono text-[var(--ink-muted)] mt-1">
                [ SECURE FIRESTORE ISOLATION: {user.email || user.displayName} ]
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="history-new-entry-btn"
              onClick={onNewEntry}
              className="btn-cyber flex items-center space-x-2 px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--bg)] border-[1.5px] border-[var(--ink)] hover:border-[var(--accent)] font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer hover:shadow-xl shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-[var(--accent)]" />
              <span>New Reflection</span>
            </button>

            {onBackToEditor && (
              <button
                id="history-exit-btn"
                onClick={onBackToEditor}
                className="btn-cyber p-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-rose-500/15 text-[var(--ink)] hover:text-rose-400 border-[1.5px] border-[var(--ink-faint)] hover:border-rose-400/50 transition-all cursor-pointer hover:shadow-md shrink-0 shadow-sm flex items-center justify-center"
                title="Close History (Esc)"
                aria-label="Exit History"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-3" />
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, keywords, or tags (#mindset, #goals)..."
              className="w-full bg-[var(--bg)] border border-[var(--ink-faint)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--ink-subtle)] focus:outline-none focus:border-[var(--accent)] font-mono transition-colors shadow-xs"
            />
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="text-xs font-mono text-[var(--ink-muted)] shrink-0">MOOD:</span>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--ink-faint)] rounded-xl px-3 py-2.5 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] cursor-pointer uppercase shadow-xs"
            >
              <option value="all" className="bg-[var(--surface)] text-[var(--ink)]">ALL TONES & MOODS</option>
              <option value="Reflective" className="bg-[var(--surface)] text-[var(--ink)]">🪞 Reflective</option>
              <option value="Grateful" className="bg-[var(--surface)] text-[var(--ink)]">🙏 Grateful</option>
              <option value="Ambitious" className="bg-[var(--surface)] text-[var(--ink)]">🚀 Ambitious</option>
              <option value="Seeking Clarity" className="bg-[var(--surface)] text-[var(--ink)]">🔍 Seeking Clarity</option>
              <option value="Contemplative" className="bg-[var(--surface)] text-[var(--ink)]">☕ Contemplative</option>
              <option value="Joyful" className="bg-[var(--surface)] text-[var(--ink)]">✨ Joyful</option>
              <option value="Challenged" className="bg-[var(--surface)] text-[var(--ink)]">⛰️ Challenged</option>
              <option value="Peaceful" className="bg-[var(--surface)] text-[var(--ink)]">🌿 Peaceful</option>
              <option value="Inspired" className="bg-[var(--surface)] text-[var(--ink)]">💡 Inspired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entry Cards List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--ink-faint)] p-12 text-center space-y-4 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-[var(--surface-card)] border border-[var(--ink-faint)] rounded-xl flex items-center justify-center text-[var(--accent)] mx-auto shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-mono text-sm font-semibold uppercase text-[var(--ink)] tracking-wider">
              {entries.length === 0 ? 'NO REFLECTIONS RECORDED YET' : 'NO MATCHING ENTRIES FOUND'}
            </h3>
            <p className="text-xs text-[var(--ink-muted)] max-w-sm mx-auto font-light">
              {entries.length === 0
                ? 'Begin your first conversation or journal entry to generate insights with Gemini.'
                : 'Try adjusting your search terms or mood filter.'}
            </p>
          </div>
          {entries.length === 0 && (
            <button
              onClick={onNewEntry}
              className="btn-cyber px-4 py-2 bg-[var(--ink)] text-[var(--bg)] border border-[var(--ink)] hover:border-[var(--accent)] font-mono text-xs font-semibold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer rounded-xl shadow-sm hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-[var(--accent)]" />
              <span>Write First Reflection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="bg-[var(--surface)] border border-[var(--ink-faint)] hover:border-[var(--accent)] p-5 flex flex-col justify-between space-y-4 transition-all rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.35)] hover:shadow-xl group cursor-pointer"
            >
              <div className="space-y-3">
                
                {/* Header info */}
                <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)]">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3 h-3 text-[var(--accent)]" />
                    <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </span>

                  {entry.mood && (
                    <span className="px-2 py-0.5 bg-[var(--surface-card)] text-[var(--accent)] text-[10px] font-mono border border-[var(--ink-faint)] uppercase rounded-md shadow-xs">
                      {entry.mood}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl font-normal text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                  {entry.title || 'Untitled Reflection'}
                </h3>

                {/* Content snippet */}
                <p className="text-xs text-[var(--ink-muted)] line-clamp-3 leading-relaxed font-light">
                  {entry.content || 'No journal text recorded.'}
                </p>

                {/* Summary badge if present */}
                {entry.summary && (
                  <div className="p-2.5 bg-[var(--surface-card)] border border-[var(--accent)]/30 text-[11px] font-serif italic text-[var(--ink)] line-clamp-2 rounded-xl shadow-xs">
                    "{entry.summary}"
                  </div>
                )}
              </div>

              {/* Footer with Tags and Multi-Turn Stats */}
              <div className="pt-3 border-t border-[var(--ink-faint)] space-y-3">
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[var(--surface-card)] text-[var(--ink-muted)] text-[10px] font-mono border border-[var(--ink-faint)] rounded-md shadow-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="text-[10px] font-mono text-[var(--ink-muted)]">+{entry.tags.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center space-x-1.5 text-[var(--ink-muted)] text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>{entry.interactions?.length || 0} AI TURNS</span>
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleExportEntry(entry, e)}
                      className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-card)] transition-colors cursor-pointer border border-transparent hover:border-[var(--ink-faint)] rounded-lg shadow-xs"
                      title="Export as Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 text-[var(--ink-muted)] hover:text-rose-400 hover:bg-[var(--surface-card)] transition-colors cursor-pointer border border-transparent hover:border-[var(--ink-faint)] rounded-lg shadow-xs"
                      title="Delete reflection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="p-1.5 text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
