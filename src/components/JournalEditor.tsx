import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  Save, 
  Tag, 
  Smile, 
  Compass, 
  Lightbulb, 
  ListChecks, 
  FileText, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Copy,
  Trash2,
  Clock,
  ArrowDown
} from 'lucide-react';
import { JournalEntry, JournalInteraction, ReflectionMode, AuthUser } from '../types';
import { saveJournalEntry } from '../lib/firebase';

interface JournalEditorProps {
  user: AuthUser;
  entry: JournalEntry | null;
  initialPrompt?: string;
  initialTitle?: string;
  onEntrySaved: (savedEntry: JournalEntry) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const REFLECTION_MODES: { id: ReflectionMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { 
    id: 'reflect', 
    label: 'Deep Reflection', 
    icon: <Compass className="w-4 h-4 text-amber-400" />,
    desc: 'Empathetic validation, cognitive clarity, and constructive perspectives'
  },
  { 
    id: 'summary', 
    label: 'Summary & Synthesis', 
    icon: <FileText className="w-4 h-4 text-blue-400" />,
    desc: 'Extract key essence, themes, and emotional tone'
  },
  { 
    id: 'brainstorm', 
    label: 'Brainstorm Ideas', 
    icon: <Lightbulb className="w-4 h-4 text-yellow-400" />,
    desc: 'Explore creative angles, possibilities, and fresh paths forward'
  },
  { 
    id: 'action', 
    label: 'Action Plan', 
    icon: <ListChecks className="w-4 h-4 text-emerald-400" />,
    desc: 'Formulate tangible next steps, constructive habits, and milestones'
  },
  { 
    id: 'deep_question', 
    label: 'Deep Questions', 
    icon: <HelpCircle className="w-4 h-4 text-purple-400" />,
    desc: 'Uncover deeper assumptions and philosophical insights'
  },
];

const PROMPT_STARTERS: Record<ReflectionMode, string[]> = {
  reflect: [
    'What underlying perspective or emotion might be driving this situation?',
    'How can I look at this experience through a lens of self-compassion and resilience?',
    'What did this experience reveal about what truly matters to me?',
  ],
  summary: [
    'Synthesize this reflection into key takeaways, core themes, and mood.',
    'What are the 3 most significant realizations in this entry?',
  ],
  brainstorm: [
    'What are 4 novel, creative ways I could approach this situation?',
    'Brainstorm alternative viewpoints I might not have considered yet.',
  ],
  action: [
    'Break this down into 3 concrete, low-friction actions I can take tomorrow.',
    'What positive habit or system would prevent this issue moving forward?',
  ],
  deep_question: [
    'What thought-provoking questions should I ask myself to go deeper?',
    'What is the unspoken fear or ambition beneath this reflection?',
  ],
};

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  entry,
  initialPrompt,
  initialTitle,
  onEntrySaved,
  onToast,
}) => {
  const [title, setTitle] = useState(entry?.title || initialTitle || '');
  const [content, setContent] = useState(entry?.content || (initialPrompt && !entry ? `Goal / Prompt: ${initialPrompt}\n\n` : ''));
  const [mood, setMood] = useState(entry?.mood || 'Reflective');
  const [tags, setTags] = useState<string[]>(entry?.tags || ['reflection']);
  const [tagInput, setTagInput] = useState('');
  const [summary, setSummary] = useState(entry?.summary || '');
  
  const [interactions, setInteractions] = useState<JournalInteraction[]>(
    entry?.interactions || []
  );
  const [currentPrompt, setCurrentPrompt] = useState(initialPrompt || '');
  const [activeMode, setActiveMode] = useState<ReflectionMode>('reflect');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeModel, setActiveModel] = useState<string>('gemini-3.6-flash');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state when incoming entry changes
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setContent(entry.content || '');
      setMood(entry.mood || 'Reflective');
      setTags(entry.tags || ['reflection']);
      setSummary(entry.summary || '');
      setInteractions(entry.interactions || []);
      setCurrentPrompt('');
    } else {
      setTitle(initialTitle || '');
      setContent(initialPrompt ? `Focus Prompt: ${initialPrompt}\n\n` : '');
      setMood('Reflective');
      setTags(['reflection', 'growth']);
      setSummary('');
      setInteractions([]);
      setCurrentPrompt(initialPrompt || '');
    }
  }, [entry?.id, initialPrompt, initialTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions, isGenerating]);

  // Handle Tag management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Save to Firestore
  const handleManualSave = async () => {
    if (!title.trim() && !content.trim()) {
      onToast('Please enter a title or journal content before saving.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('saving');

      const entryId = entry?.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const saved = await saveJournalEntry(user.uid, {
        id: entryId,
        title: title.trim() || 'Untitled Reflection',
        content: content.trim(),
        mood: mood || 'Reflective',
        tags: tags.length > 0 ? tags : ['journal'],
        summary: summary || undefined,
        createdAt: entry?.createdAt || Date.now(),
        updatedAt: Date.now(),
        interactions,
      });

      setSaveStatus('saved');
      onEntrySaved(saved);
      onToast('Reflection safely saved to Firestore.', 'success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveStatus('error');
      onToast(`Failed to save to Firestore: ${error?.message || 'Database error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick auto-summarization & tagging with Gemini
  const handleAutoSummarize = async () => {
    if (!content.trim()) {
      onToast('Write some content first to generate a summary and tags.', 'info');
      return;
    }

    try {
      setIsSummarizing(true);
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Untitled',
          content,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to summarize');
      }

      const data = await res.json();
      setSummary(data.summary || '');
      if (data.mood) setMood(data.mood);
      if (Array.isArray(data.tags)) {
        const merged = Array.from(new Set([...tags, ...data.tags]));
        setTags(merged);
      }
      onToast('Gemini analyzed entry and extracted insights & tags.', 'success');
    } catch (err: any) {
      onToast(`Summarization notice: ${err?.message || 'Check Gemini API Key in Settings'}`, 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Conversational multi-turn reflection with Gemini
  const handleSendPrompt = async (promptToSend?: string) => {
    const textPrompt = (promptToSend || currentPrompt).trim();
    if (!textPrompt) return;
    if (!content.trim() && interactions.length === 0) {
      onToast('Please write some thoughts in your journal before asking Gemini.', 'info');
      return;
    }

    const userTurn: JournalInteraction = {
      id: `turn_${Date.now()}`,
      role: 'user',
      text: textPrompt,
      mode: activeMode,
      timestamp: Date.now(),
    };

    const updatedInteractions = [...interactions, userTurn];
    setInteractions(updatedInteractions);
    setCurrentPrompt('');
    setIsGenerating(true);

    try {
      // Map interaction history into clean history format
      const historyPayload = interactions.map((i) => ({
        role: i.role,
        text: i.text,
      }));

      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textPrompt,
          mode: activeMode,
          history: historyPayload,
          entryContext: content,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gemini response error');
      }

      const result = await response.json();
      setActiveModel(result.modelUsed || 'gemini-3.6-flash');

      const modelTurn: JournalInteraction = {
        id: `turn_${Date.now() + 1}`,
        role: 'model',
        text: result.text,
        mode: activeMode,
        modelUsed: result.modelUsed,
        timestamp: Date.now(),
      };

      const finalInteractions = [...updatedInteractions, modelTurn];
      setInteractions(finalInteractions);

      // Auto-save entry with verified interaction persistence (Guaranteed Transaction Verification)
      const entryId = entry?.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const saved = await saveJournalEntry(user.uid, {
        id: entryId,
        title: title.trim() || 'Untitled Reflection',
        content: content.trim(),
        mood: mood || 'Reflective',
        tags: tags.length > 0 ? tags : ['journal'],
        summary: summary || undefined,
        createdAt: entry?.createdAt || Date.now(),
        updatedAt: Date.now(),
        interactions: finalInteractions,
      });

      onEntrySaved(saved);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      console.error('Reflection error:', err);
      onToast(`Gemini error: ${err?.message || 'Check Gemini API Key'}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    onToast('Copied to clipboard', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Action Bar & Metadata */}
      <div className="bg-[var(--surface)] border border-[var(--ink-faint)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          {/* Tone / Mood Selector */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border-[1.5px] border-[var(--ink-faint)] text-xs text-[var(--ink)] font-mono shadow-sm">
            <Smile className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="text-[var(--ink-muted)]">TONE:</span>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="bg-transparent text-[var(--ink)] font-mono font-medium focus:outline-none cursor-pointer text-xs"
            >
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

          {/* AI Summarize & Tag Action */}
          <button
            id="btn-auto-summarize"
            onClick={handleAutoSummarize}
            disabled={isSummarizing || !content.trim()}
            className="btn-cyber flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface)] border border-[var(--ink-faint)] hover:border-[var(--accent)] font-mono text-xs text-[var(--ink)] hover:text-[var(--accent)] transition-all disabled:opacity-40 cursor-pointer hover:shadow-md"
            title="Auto-generate summary and thematic tags with Gemini"
          >
            {isSummarizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
            <span>[ EXTRACT TAGS ]</span>
          </button>
        </div>

        {/* Save & Isolation Status */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="font-mono text-xs text-[var(--ink-muted)] flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[var(--accent)]" />
            <span>{entry?.updatedAt ? new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'DRAFT'}</span>
          </div>

          <button
            id="btn-save-firestore"
            onClick={handleManualSave}
            disabled={isSaving}
            className={`btn-cyber flex items-center space-x-1.5 px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-[1.5px] hover:scale-105 active:scale-95 hover:shadow-lg ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.45)]'
                : saveStatus === 'error'
                ? 'bg-rose-700 text-white border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.45)]'
                : 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] hover:border-[var(--accent)] shadow-md'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-current" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>
              {isSaving
                ? 'SAVING...'
                : saveStatus === 'saved'
                ? 'SAVED TO CLOUD'
                : saveStatus === 'error'
                ? 'RETRY SAVE'
                : 'SAVE REFLECTION'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Journal & Reflection Input (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div 
            className="border border-[var(--ink-faint)] p-5 sm:p-6 space-y-4 rounded-2xl transition-all"
            style={{ 
              backgroundColor: 'var(--surface)',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            
            {/* Title Input */}
            <div>
              <input
                id="journal-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of your reflection or experience..."
                className="w-full font-serif bg-transparent text-[var(--ink)] placeholder-[var(--ink-subtle)] focus:outline-none border-b border-[var(--ink-faint)] focus:border-[var(--accent)] pb-2 transition-colors"
                style={{ fontWeight: 'bold', fontSize: '28px', borderWidth: '1px', borderStyle: 'none none solid none' }}
              />
            </div>

            {/* Summary Banner if generated */}
            {summary && (
              <div className="p-3.5 bg-[var(--surface-card)] border border-[var(--accent)]/40 text-xs space-y-1 font-mono rounded-xl shadow-xs">
                <div className="flex items-center space-x-1.5 text-[var(--accent)] font-semibold uppercase text-[10px] tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>GEMINI EXECUTIVE ESSENCE</span>
                </div>
                <p className="font-serif italic text-sm text-[var(--ink)] leading-relaxed font-normal">{summary}</p>
              </div>
            )}

            {/* Content Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)] uppercase tracking-wider">
                <span>[ JOURNAL STREAM OF CONSCIOUSNESS ]</span>
                <span>{content.trim() ? `${content.trim().split(/\s+/).length} WORDS` : '0 WORDS'}</span>
              </div>
              <textarea
                id="journal-content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="What happened today? What thoughts, commitments, or insights are unfolding in your mind? Write freely..."
                className="w-full border border-[var(--ink-faint)] rounded-xl p-4 text-sm text-[var(--ink)] placeholder-[var(--ink-subtle)] focus:outline-none focus:border-[var(--accent)] font-sans leading-relaxed resize-y min-h-[240px] transition-colors"
                style={{ 
                  backgroundColor: 'var(--surface-input)',
                  boxShadow: 'var(--input-shadow)'
                }}
              />
            </div>

            {/* Tags Management */}
            <div className="space-y-2 pt-3 border-t border-[var(--ink-faint)]">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)]">
                <span className="flex items-center space-x-1.5">
                  <Tag className="w-3 h-3 text-[var(--accent)]" />
                  <span>THEMATIC TAGS</span>
                </span>
                <span className="text-[10px] text-[var(--ink-subtle)]">[ PRESS ENTER / COMMA ]</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[var(--surface-card)] text-[var(--ink)] font-mono text-xs border border-[var(--ink-faint)] rounded-lg shadow-xs"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[var(--ink-muted)] hover:text-rose-400 ml-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="+ Add tag..."
                  className="bg-transparent font-mono text-xs text-[var(--ink)] placeholder-[var(--ink-subtle)] focus:outline-none px-2 py-0.5 border-b border-transparent focus:border-[var(--accent)]"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Multi-Turn Gemini Dialogue & Reflections (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div 
            className="border border-[var(--ink-faint)] p-5 flex flex-col h-[620px] rounded-2xl transition-all"
            style={{ 
              backgroundColor: 'var(--surface)',
              boxShadow: 'var(--card-shadow)'
            }}
          >
            
            {/* Header with Mode Selector */}
            <div className="pb-3 border-b border-[var(--ink-faint)] space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface-card)] border border-[var(--accent)]/40 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                  </div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                    GEMINI REFLECTION CORE
                  </h3>
                </div>
                <span className="text-[10px] text-[var(--accent)] px-2 py-0.5 rounded-md bg-[var(--surface-card)] border border-[var(--ink-faint)] font-mono shadow-xs">
                  {activeModel}
                </span>
              </div>

              {/* Reflection Mode Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                {REFLECTION_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMode(m.id)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase whitespace-nowrap transition-all border cursor-pointer hover:shadow-sm ${
                      activeMode === m.id
                        ? 'bg-[var(--surface-card)] text-[var(--accent)] border-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]'
                        : 'bg-transparent text-[var(--ink-muted)] border-[var(--ink-faint)] hover:text-[var(--ink)] hover:border-[var(--accent)]'
                    }`}
                    title={m.desc}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1 text-xs">
              {interactions.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-4 text-[var(--ink-muted)]">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--surface-card)] border border-[var(--ink-faint)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-mono text-xs font-semibold text-[var(--ink)] uppercase tracking-wider">
                      INITIATE COGNITIVE DIALOGUE
                    </p>
                    <p className="text-xs text-[var(--ink-muted)] font-light">
                      Select a starter spark below or type your thought to converse with Gemini.
                    </p>
                  </div>

                  {/* Starter Prompts */}
                  <div className="w-full space-y-1.5 pt-2 text-left">
                    {PROMPT_STARTERS[activeMode].map((starter, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendPrompt(starter)}
                        className="w-full text-left p-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface)] border border-[var(--ink-faint)] hover:border-[var(--accent)] font-mono text-[11px] text-[var(--ink)] hover:text-[var(--accent)] transition-all cursor-pointer shadow-xs hover:shadow-sm"
                      >
                        "{starter}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                interactions.map((turn, index) => (
                  <div
                    key={turn.id || index}
                    className={`flex flex-col space-y-1 ${
                      turn.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[var(--ink-muted)] px-1">
                      <span className="font-bold text-[var(--accent)]">{turn.role === 'user' ? 'YOU' : 'GEMINI'}</span>
                      <span>•</span>
                      <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {turn.mode && (
                        <span className="text-[var(--accent)] uppercase text-[9px] font-mono">[{turn.mode}]</span>
                      )}
                    </div>

                    <div
                      className={`max-w-[92%] p-3.5 text-xs leading-relaxed relative group border rounded-2xl ${
                        turn.role === 'user'
                          ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] font-medium shadow-sm'
                          : 'bg-[var(--surface-card)] text-[var(--ink)] border-[var(--ink-faint)] shadow-sm'
                      }`}
                    >
                      {turn.role === 'model' ? (
                        <div className="prose prose-invert prose-xs max-w-none space-y-2">
                          <ReactMarkdown>{turn.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{turn.text}</p>
                      )}

                      {/* Copy response action */}
                      {turn.role === 'model' && (
                        <button
                          onClick={() => handleCopyText(turn.text, index)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--accent)] border border-[var(--ink-faint)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                          title="Copy response"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Generating Spinner */}
              {isGenerating && (
                <div className="flex items-center space-x-2 text-xs font-mono text-[var(--accent)] p-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--accent)]/40 w-fit animate-pulse shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>SYNTHESIZING COGNITIVE RESPONSE...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Input Form */}
            <div className="pt-3 border-t border-[var(--ink-faint)] shrink-0 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  id="gemini-prompt-input"
                  type="text"
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  placeholder={`Ask Gemini in ${activeMode.replace('_', ' ')} mode...`}
                  disabled={isGenerating}
                  className="flex-1 border border-[var(--ink-faint)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] placeholder-[var(--ink-subtle)] focus:outline-none focus:border-[var(--accent)] font-mono transition-colors"
                  style={{
                    backgroundColor: 'var(--surface-input)',
                    boxShadow: 'var(--input-shadow)'
                  }}
                />
                <button
                  id="gemini-submit-btn"
                  type="submit"
                  disabled={isGenerating || !currentPrompt.trim()}
                  className="btn-cyber p-2.5 rounded-xl border-[1.5px] border-[var(--btn-accent)] hover:brightness-110 disabled:opacity-40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shrink-0 font-bold"
                  style={{ 
                    backgroundColor: 'var(--btn-accent)',
                    color: 'var(--btn-accent-text)',
                    boxShadow: 'var(--btn-accent-shadow)'
                  }}
                  title="Send prompt to Gemini"
                >
                  <Send 
                    className="w-4 h-4 stroke-[2.8]" 
                    style={{ 
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35))'
                    }} 
                  />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
