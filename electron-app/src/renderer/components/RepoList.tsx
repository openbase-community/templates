import {
  type DragEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Settings, X } from 'lucide-react';
import { getContextMenuActions } from './contextMenuActions';

type RepoStatus = 'clean' | 'dirty' | 'out-of-sync' | 'not-a-repo' | 'missing';

interface RepoEntry {
  path: string;
  name?: string;
  status?: RepoStatus;
}

const STATUS_CONFIG: Record<
  RepoStatus,
  { color: string; label: string; dot: string }
> = {
  clean: {
    color: 'text-green-500',
    label: 'Clean',
    dot: 'bg-green-500',
  },
  dirty: {
    color: 'text-red-500',
    label: 'Uncommitted changes',
    dot: 'bg-red-500',
  },
  'out-of-sync': {
    color: 'text-yellow-500',
    label: 'Out of sync',
    dot: 'bg-yellow-500',
  },
  'not-a-repo': {
    color: 'text-muted-foreground',
    label: '',
    dot: 'bg-gray-400',
  },
  missing: {
    color: 'text-muted-foreground',
    label: 'Not found',
    dot: 'bg-gray-400',
  },
};

export default function RepoList() {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<RepoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const repoContextActions = useMemo(() => getContextMenuActions(), []);

  const fetchStatuses = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const repoList: { path: string; name?: string }[] =
      await window.electron.repoService.getRepos();

    const withStatuses = await Promise.all(
      repoList.map(async (repo) => {
        let status: RepoStatus | undefined;
        try {
          status = await window.electron.repoService.getRepoStatus(repo.path);
        } catch {
          status = 'missing';
        }
        return { ...repo, status };
      }),
    );

    setRepos(withStatuses);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(() => fetchStatuses(false), 15000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  const handleRemove = async (e: MouseEvent, repoPath: string) => {
    e.stopPropagation();
    await window.electron.repoService.removeRepo(repoPath);
    setRepos((prev) => prev.filter((r) => r.path !== repoPath));
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const { files } = e.dataTransfer;
    await Promise.all(
      Array.from(files).map((f) => window.electron.repoService.addRepo(f.path)),
    );
    fetchStatuses();
  };

  const handleRepoContextMenu = useCallback(
    async (e: MouseEvent, repoPath: string) => {
      e.preventDefault();

      const selectedId = await window.electron.repoService.showContextMenu(
        repoContextActions.map((action, index) => ({
          id: `repo-action-${index}`,
          label: action.label,
          type: 'normal' as const,
        })),
      );

      if (!selectedId?.startsWith('repo-action-')) return;
      const actionIndex = Number(selectedId.slice('repo-action-'.length));
      const action = repoContextActions[actionIndex];
      if (!action) return;
      action.onClick(repoPath);
    },
    [repoContextActions],
  );

  const handlePickDirectory = async () => {
    const dirPath = await window.electron.repoService.pickDirectory();
    if (dirPath) {
      await window.electron.repoService.addRepo(dirPath);
      fetchStatuses();
    }
  };

  return (
    <div
      className={`flex flex-col h-full ${dragging ? 'ring-2 ring-primary ring-inset' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-xs text-muted-foreground">
            {repos.length} project{repos.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={handlePickDirectory}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="Add project"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => fetchStatuses()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {repos.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <p className="text-sm">No repositories configured</p>
            <p className="text-xs">
              Add repos to{' '}
              <code className="px-1 py-0.5 bg-muted rounded text-xs">
                ~/.multi/repos.json
              </code>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {repos.map((repo) => {
              const config = repo.status
                ? STATUS_CONFIG[repo.status]
                : undefined;
              const displayName =
                repo.name || repo.path.split('/').pop() || repo.path;
              const isClickable =
                repo.status !== 'missing' && repo.status !== 'not-a-repo';

              return (
                <div
                  key={repo.path}
                  className="group flex items-center gap-3 px-6 py-3 hover:bg-accent/50 transition-colors"
                  onContextMenu={(e) => {
                    handleRepoContextMenu(e, repo.path);
                  }}
                >
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() =>
                      navigate(
                        `/diff?path=${encodeURIComponent(repo.path)}&name=${encodeURIComponent(displayName)}`,
                      )
                    }
                    className={`flex items-center gap-3 flex-1 min-w-0 text-left ${!isClickable ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${config?.dot ?? 'bg-gray-400'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {repo.path}
                      </p>
                    </div>
                    {config && (
                      <span
                        className={`text-xs font-medium shrink-0 ${config.color}`}
                      >
                        {config.label}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, repo.path)}
                    className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Remove project"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
