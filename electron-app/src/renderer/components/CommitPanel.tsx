import { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const COMMIT_PANEL_MODE_KEY = '$${name_kebab}:commit-panel-mode';

function loadCommitPanelMode(): 'single' | 'per-repo' {
  try {
    const persisted = localStorage.getItem(COMMIT_PANEL_MODE_KEY);
    if (persisted === 'single' || persisted === 'per-repo') {
      return persisted;
    }
  } catch {
    // localStorage may be unavailable.
  }
  return 'single';
}

export interface CommitPanelProps {
  repoNames: string[];
  onCommit: (messages: Record<string, string>) => Promise<void>;
  onGenerateSingleMessage: () => Promise<string>;
  onGenerateRepoMessage: (repoName: string) => Promise<string>;
  onClose?: () => void;
  summary: { files: number; lines: number };
  committing: boolean;
}

export default function CommitPanel({
  repoNames,
  onCommit,
  onGenerateSingleMessage,
  onGenerateRepoMessage,
  onClose,
  summary,
  committing,
}: CommitPanelProps) {
  const [mode, setMode] = useState<'single' | 'per-repo'>(() =>
    loadCommitPanelMode(),
  );
  const [singleMessage, setSingleMessage] = useState('');
  const [perRepoMessages, setPerRepoMessages] = useState<
    Record<string, string>
  >({});
  const [activeRepoTab, setActiveRepoTab] = useState(repoNames[0] ?? '');
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const currentRepoName = useMemo(() => {
    if (activeRepoTab && repoNames.includes(activeRepoTab))
     
      return activeRepoTab;
    return repoNames[0] ?? '';
  }, [activeRepoTab, repoNames]);

  useEffect(() => {
    if (!repoNames.length) {
      setActiveRepoTab('');
      return;
    }
    if (!activeRepoTab || !repoNames.includes(activeRepoTab)) {
      setActiveRepoTab(repoNames[0]);
    }
  }, [repoNames, activeRepoTab]);

  useEffect(() => {
    try {
      localStorage.setItem(COMMIT_PANEL_MODE_KEY, mode);
    } catch {
      // localStorage may be unavailable.
    }
  }, [mode]);

  const handleCommit = async () => {
    setError(null);
    const messages: Record<string, string> = {};
    if (mode === 'single') {
      if (!singleMessage.trim()) return;
      for (const name of repoNames) {
        messages[name] = singleMessage.trim();
      }
    } else {
      for (const name of repoNames) {
        const msg = (perRepoMessages[name] ?? '').trim();
        if (!msg) {
          setError(`Missing commit message for ${name}`);
          return;
        }
        messages[name] = msg;
      }
    }
    try {
      await onCommit(messages);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const canCommit =
    !committing &&
    summary.files > 0 &&
    (mode === 'single'
      ? singleMessage.trim().length > 0
      : repoNames.every((n) => (perRepoMessages[n] ?? '').trim().length > 0));

  const handleGenerate = async () => {
    setError(null);
    setGenerating(true);
    try {
      if (mode === 'single') {
        const generated = await onGenerateSingleMessage();
        setSingleMessage(generated);
      } else {
        const repoName = currentRepoName;
        if (!repoName) {
          throw new Error('No repository selected.');
        }
        const generated = await onGenerateRepoMessage(repoName);
        setPerRepoMessages((prev) => ({ ...prev, [repoName]: generated }));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllPerRepo = async () => {
    if (mode !== 'per-repo') return;
    setError(null);
    setGenerating(true);
    try {
      const nextMessages: Record<string, string> = {};
      const failures: string[] = [];

      for (const repoName of repoNames) {
        try {
          const generated = await onGenerateRepoMessage(repoName);
          nextMessages[repoName] = generated;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          failures.push(`${repoName}: ${msg}`);
        }
      }

      setPerRepoMessages((prev) => ({ ...prev, ...nextMessages }));

      if (failures.length > 0) {
        const maxShown = 3;
        const shown = failures.slice(0, maxShown).join(' | ');
        const extra =
          failures.length > maxShown
            ? ` (+${failures.length - maxShown} more)`
            : '';
        setError(`Some descriptions failed: ${shown}${extra}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-3 bg-muted/30 space-y-2">
      {/* Top bar: mode toggle + close */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 text-xs">
          <button
            className={`px-2 py-1 rounded transition-colors ${mode === 'single' ? 'bg-background shadow-sm font-medium' : 'hover:bg-background/50'}`}
            onClick={() => setMode('single')}
          >
            Single
          </button>
          {repoNames.length > 1 && (
            <button
              className={`px-2 py-1 rounded transition-colors ${mode === 'per-repo' ? 'bg-background shadow-sm font-medium' : 'hover:bg-background/50'}`}
              onClick={() => setMode('per-repo')}
            >
              Per-repo
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Per-repo tab bar */}
      {mode === 'per-repo' && repoNames.length > 1 && (
        <div className="flex gap-1 text-xs border-b border-border">
          {repoNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveRepoTab(name)}
              className={`px-2 py-1 transition-colors ${activeRepoTab === name ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Commit message textarea */}
      {mode === 'single' ? (
        <textarea
          className="w-full h-20 px-2 py-1.5 text-sm rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Commit message..."
          value={singleMessage}
          onChange={(e) => setSingleMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canCommit) {
              handleCommit();
            }
          }}
        />
      ) : (
        <textarea
          className="w-full h-20 px-2 py-1.5 text-sm rounded-md border border-border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={
            currentRepoName
              ? `Commit message for ${currentRepoName}...`
              : 'Select a repo tab to edit its message.'
          }
          value={
            currentRepoName ? (perRepoMessages[currentRepoName] ?? '') : ''
          }
          onChange={(e) =>
            currentRepoName
              ? setPerRepoMessages((prev) => ({
                  ...prev,
                  [currentRepoName]: e.target.value,
                }))
              : undefined
          }
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canCommit) {
              handleCommit();
            }
          }}
        />
      )}

      {/* Error banner */}
      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 rounded px-2 py-1">
          {error}
        </div>
      )}

      {/* Bottom row: commit button + summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={
              committing ||
              generating ||
              summary.files === 0 ||
              (mode === 'per-repo' && !currentRepoName)
            }
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {generating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === 'single'
              ? 'Generate Message'
              : currentRepoName
                ? `Generate for ${currentRepoName}`
                : 'Generate for repo'}
          </button>
          {mode === 'per-repo' && repoNames.length > 1 && (
            <button
              onClick={handleGenerateAllPerRepo}
              disabled={committing || generating || summary.files === 0}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {generating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Generate All
            </button>
          )}
          <button
            onClick={handleCommit}
            disabled={!canCommit || generating}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {committing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Commit
          </button>
        </div>
        <span className="text-xs text-muted-foreground">
          {summary.files} file{summary.files !== 1 ? 's' : ''}, {summary.lines}{' '}
          line{summary.lines !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
