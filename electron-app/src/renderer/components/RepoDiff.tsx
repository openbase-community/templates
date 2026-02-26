import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DiffViewer,
  DiffSelection,
  DiffSelectionType,
  formatPatch,
  formatDiscardPatch,
  parseDiff,
  LineType,
  buildRepoFileEntries,
  type ContextMenuAction,
  type HistoryGroup,
  type NativeContextMenuItem,
  type DiscardTarget,
  type Repository,
  type FileEntry,
} from 'multi-react';
import { getContextMenuActions } from './contextMenuActions';
import CommitPanel from './CommitPanel';

function summarizeSyncError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        !line.startsWith("Error invoking remote method 'repo:push':") &&
        !line.startsWith('To https://') &&
        !line.startsWith('hint:'),
    );

  if (lines.length === 0) {
    return 'Unknown sync error';
  }

  // Prefer actionable lines like non-fast-forward rejection over command boilerplate.
  const actionable =
    lines.find((line) => line.includes('[rejected]')) ??
    lines.find((line) => line.startsWith('error:')) ??
    lines.find((line) => !line.startsWith('Command failed:')) ??
    lines[0];

  return actionable;
}

function rawSyncError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isNoPushDestinationError(error: unknown): boolean {
  const raw = rawSyncError(error);
  return (
    raw.includes('No configured push destination') ||
    raw.includes('has no upstream branch')
  );
}

function normalizeFilePathForCompare(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function diffPathToRepoPath(diffPath: string): string | null {
  const stripped = diffPath.replace(/^[ab]\//, '');
  if (!stripped || stripped === '/dev/null' || stripped === 'dev/null') {
    return null;
  }
  return stripped;
}

function getStagePathsForEntry(entry: FileEntry): string[] {
  const paths = new Set<string>();
  const oldPath = diffPathToRepoPath(entry.file.oldName);
  const newPath = diffPathToRepoPath(entry.file.newName);

  if (oldPath) paths.add(oldPath);
  if (newPath) paths.add(newPath);
  if (paths.size === 0 && entry.displayPath) {
    paths.add(entry.displayPath);
  }

  return [...paths];
}

function describeUnpatchableSelection(entry: FileEntry): string {
  const oldPath = diffPathToRepoPath(entry.file.oldName);
  const newPath = diffPathToRepoPath(entry.file.newName);

  if (entry.status === 'renamed' && oldPath && newPath && oldPath !== newPath) {
    return `- renamed: ${oldPath} -> ${newPath}`;
  }

  if (entry.file.isBinary) {
    return `- ${entry.status}: ${entry.displayPath} (binary)`;
  }

  return `- ${entry.status}: ${entry.displayPath}`;
}

function prioritizeTargetFile(diff: string, targetFilePath: string): string {
  const normalizedTarget = normalizeFilePathForCompare(targetFilePath);
  if (!normalizedTarget || !diff.trim()) return diff;

  const files = parseDiff(diff);
  if (files.length < 2) return diff;

  const targetIndex = files.findIndex((file) => {
    const displayPath = file.isDeleted
      ? file.oldName.replace(/^[ab]\//, '')
      : file.newName.replace(/^[ab]\//, '');
    return normalizeFilePathForCompare(displayPath) === normalizedTarget;
  });

  if (targetIndex <= 0) return diff;

  const orderedFiles = [
    files[targetIndex],
    ...files.filter((_file, index) => index !== targetIndex),
  ];
  const allSelected = DiffSelection.fromInitialSelection(DiffSelectionType.All);

  const rebuiltDiff = orderedFiles
    .map((file) => formatPatch(file, allSelected, file.isNew === true))
    .filter((patch): patch is string => Boolean(patch))
    .join('');

  return rebuiltDiff || diff;
}

export default function RepoDiff() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const repoPath = searchParams.get('path') ?? '';
  const targetFilePath = searchParams.get('file') ?? '';
  const repoName = searchParams.get('name') ?? repoPath.split('/').pop() ?? '';

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyGroups, setHistoryGroups] = useState<HistoryGroup[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [selections, setSelections] = useState<Record<string, DiffSelection>>(
    {},
  );
  const [committing, setCommitting] = useState(false);
  const [pushingAll, setPushingAll] = useState(false);
  const [hasPushableChanges, setHasPushableChanges] = useState(false);

  const fetchDiff = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setHistoryLoading(true);

      const historyPromise = window.electron.repoService
        .getCombinedHistory(repoPath)
        .then((combinedHistory) => {
          setHistoryGroups(combinedHistory);
        })
        .catch(() => {
          setHistoryGroups([]);
        })
        .finally(() => {
          setHistoryLoading(false);
        });

      const subRepos = await window.electron.repoService.getSubRepos(repoPath);

      if (subRepos && subRepos.length > 0) {
        const allRepos = await Promise.all([
          (async () => {
            let diff = '';
            try {
              diff = await window.electron.repoService.getRepoDiff(repoPath);
              diff = prioritizeTargetFile(diff, targetFilePath);
            } catch {
              /* root may not have changes */
            }
            return { path: repoPath, name: repoName, diff };
          })(),
          ...subRepos.map(async (sub) => {
            let diff = '';
            try {
              diff = await window.electron.repoService.getRepoDiff(sub.path);
            } catch {
              /* sub-repo may be missing or clean */
            }
            return { path: sub.path, name: sub.name, diff };
          }),
        ]);
        setRepositories(allRepos);
        const syncStates = await Promise.all(
          allRepos.map((repo) =>
            window.electron.repoService
              .getRepoSyncState(repo.path)
              .catch(() => ({
                ahead: 0,
                behind: 0,
                hasUpstream: false,
                isRepo: false,
              })),
          ),
        );
        setHasPushableChanges(syncStates.some((s) => s.ahead > 0));
      } else {
        const diff = await window.electron.repoService.getRepoDiff(repoPath);
        setRepositories([
          {
            path: repoPath,
            name: repoName,
            diff: prioritizeTargetFile(diff, targetFilePath),
          },
        ]);
        const syncState = await window.electron.repoService
          .getRepoSyncState(repoPath)
          .catch(() => ({
            ahead: 0,
            behind: 0,
            hasUpstream: false,
            isRepo: false,
          }));
        setHasPushableChanges(syncState.ahead > 0);
      }

      setLoading(false);
      await historyPromise;
    },
    [repoPath, repoName, targetFilePath],
  );

  useEffect(() => {
    fetchDiff();
  }, [fetchDiff]);

  // Build entries for commit mode summary & orchestration
  const entries = useMemo(
    () => buildRepoFileEntries(repositories).entries,
    [repositories],
  );

  // Keep selections in sync with entries: add new files as All, remove stale keys
  useEffect(() => {
    setSelections((prev) => {
      const next: Record<string, DiffSelection> = {};
      for (const entry of entries) {
        next[entry.key] =
          prev[entry.key] ??
          DiffSelection.fromInitialSelection(DiffSelectionType.All);
      }
      return next;
    });
  }, [entries]);

  // Count selected lines for summary
  const summary = useMemo(() => {
    let files = 0;
    let lines = 0;
    for (const entry of entries) {
      const sel = selections[entry.key];
      if (!sel) continue;
      const selType = sel.getSelectionType();
      if (selType === DiffSelectionType.None) continue;
      files++;
      let idx = 0;
      for (const block of entry.file.blocks) {
        for (const line of block.lines) {
          if (
            (line.type === LineType.INSERT || line.type === LineType.DELETE) &&
            sel.isSelected(idx)
          ) {
            lines++;
          }
          idx++;
        }
      }
    }
    return { files, lines };
  }, [entries, selections]);

  // Repos that have selected changes
  const reposWithChanges = useMemo(() => {
    const names = new Set<string>();
    for (const entry of entries) {
      const sel = selections[entry.key];
      if (sel && sel.getSelectionType() !== DiffSelectionType.None) {
        names.add(entry.repoName);
      }
    }
    return [...names];
  }, [entries, selections]);

  // Repo path lookup
  const repoPathByName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const repo of repositories) {
      map[repo.name] = repo.path;
    }
    return map;
  }, [repositories]);

  const handleStageAndCommit = useCallback(
    async (messages: Record<string, string>) => {
      setCommitting(true);
      try {
        // Group entries by repo
        const byRepo: Record<string, FileEntry[]> = {};
        for (const entry of entries) {
          const sel = selections[entry.key];
          if (!sel || sel.getSelectionType() === DiffSelectionType.None)
            continue;
          if (!byRepo[entry.repoName]) byRepo[entry.repoName] = [];
          byRepo[entry.repoName].push(entry);
        }

        for (const [repoName, repoEntries] of Object.entries(byRepo)) {
          const rPath = repoPathByName[repoName];
          if (!rPath) continue;

          const patchParts: string[] = [];
          const fullySelectedPaths = new Set<string>();

          for (const entry of repoEntries) {
            const sel = selections[entry.key];
            if (!sel) continue;
            const isNew = entry.file.isNew === true;
            const selType = sel.getSelectionType();

            if (isNew && selType === DiffSelectionType.All) {
              // Fully selected new file — use git add
              fullySelectedPaths.add(entry.displayPath);
            } else {
              // Generate patch
              const patch = formatPatch(entry.file, sel, isNew);
              if (patch) {
                patchParts.push(patch);
              } else if (selType === DiffSelectionType.All) {
                // Fall back to git add for changes with no line-level patch
                for (const filePath of getStagePathsForEntry(entry)) {
                  fullySelectedPaths.add(filePath);
                }
              }
            }
          }

          const stageFilePaths = [...fullySelectedPaths];

          // Reset index first
          if (patchParts.length > 0 || stageFilePaths.length > 0) {
            // Stage partial patches
            if (patchParts.length > 0) {
              await window.electron.repoService.stageChanges(
                rPath,
                patchParts.join(''),
              );
            }

            // Stage fully-selected files (new or non-patchable)
            if (stageFilePaths.length > 0) {
              await window.electron.repoService.stageFiles(
                rPath,
                stageFilePaths,
              );
            }

            // Commit
            const message = messages[repoName];
            if (message) {
              await window.electron.repoService.commit(rPath, message);
            }
          }
        }

        fetchDiff();
      } finally {
        setCommitting(false);
      }
    },
    [entries, selections, repoPathByName, fetchDiff],
  );

  const buildSelectedDiffForRepo = useCallback(
    (repoName: string): string => {
      const patches: string[] = [];
      const nonPatchable: string[] = [];
      for (const entry of entries) {
        if (entry.repoName !== repoName) continue;
        const sel = selections[entry.key];
        if (!sel) continue;
        const selType = sel.getSelectionType();
        if (selType === DiffSelectionType.None) continue;
        const isNew = entry.file.isNew === true;
        const patch = formatPatch(entry.file, sel, isNew);
        if (patch) {
          patches.push(patch);
        } else if (selType === DiffSelectionType.All) {
          nonPatchable.push(describeUnpatchableSelection(entry));
        }
      }

      if (nonPatchable.length > 0) {
        patches.push(
          [
            '# Non-text or metadata-only selected changes',
            ...nonPatchable,
          ].join('\n'),
        );
      }
      return patches.join('\n');
    },
    [entries, selections],
  );

  const handleGenerateSingleMessage = useCallback(async (): Promise<string> => {
    const parts: string[] = [];
    for (const repoName of reposWithChanges) {
      const repoDiff = buildSelectedDiffForRepo(repoName);
      if (!repoDiff.trim()) continue;
      if (reposWithChanges.length > 1) {
        parts.push(`# Repo: ${repoName}\n${repoDiff}`);
      } else {
        parts.push(repoDiff);
      }
    }
    const diff = parts.join('\n');
    if (!diff.trim()) {
      throw new Error('No selected changes to summarize.');
    }
    return window.electron.repoService.generateCommitMessage(diff);
  }, [reposWithChanges, buildSelectedDiffForRepo]);

  const handleGenerateRepoMessage = useCallback(
    async (repoName: string): Promise<string> => {
      const diff = buildSelectedDiffForRepo(repoName);
      if (!diff.trim()) {
        throw new Error(`No selected changes for ${repoName}.`);
      }
      return window.electron.repoService.generateCommitMessage(diff);
    },
    [buildSelectedDiffForRepo],
  );

  const handleDiscard = useCallback(
    async (target: DiscardTarget) => {
      const { fileEntry } = target;
      const rPath = fileEntry.repoPath;

      if (target.type === 'file') {
        const isNew = fileEntry.file.isNew === true;
        await window.electron.repoService.discardFile(
          rPath,
          fileEntry.displayPath,
          isNew,
        );
      } else {
        // Build a DiffSelection from the line indices, then generate a discard patch
        const sel = DiffSelection.fromInitialSelection(DiffSelectionType.None);
        let updated = sel;
        for (const idx of target.lineIndices) {
          updated = updated.withLineSelection(idx, true);
        }

        // --- DEBUG LOGGING ---
        console.log('[discard] lineIndices:', target.lineIndices);
        console.log(
          '[discard] file.blocks:',
          JSON.stringify(
            fileEntry.file.blocks.map((b) => ({
              header: b.header,
              oldStartLine: b.oldStartLine,
              newStartLine: b.newStartLine,
              lines: b.lines.map((l, i) => ({
                i,
                type: l.type,
                content: l.content,
                oldNumber: l.oldNumber,
                newNumber: l.newNumber,
              })),
            })),
            null,
            2,
          ),
        );
        console.log(
          '[discard] selection selected indices:',
          target.lineIndices.map((i) => `${i}:${updated.isSelected(i)}`),
        );
        // --- END DEBUG ---

        const patch = formatDiscardPatch(fileEntry.file, updated);

        // --- DEBUG LOGGING ---
        console.log('[discard] generated patch:');
        console.log(patch ?? '(null)');
        // --- END DEBUG ---

        if (patch) {
          await window.electron.repoService.discardLines(rPath, patch);
        }
      }

      fetchDiff();
    },
    [fetchDiff],
  );

  const handlePushAll = useCallback(async () => {
    setPushingAll(true);
    try {
      const repoPaths = [...new Set(repositories.map((repo) => repo.path))];
      if (repoPaths.length === 0) return;

      let failures: {
        repoPath: string;
        message: string;
        needsDestinationFix: boolean;
      }[] = [];

      for (const rPath of repoPaths) {
        try {
          await window.electron.repoService.push(rPath);
        } catch (error: unknown) {
          failures.push({
            repoPath: rPath,
            message: summarizeSyncError(error),
            needsDestinationFix: isNoPushDestinationError(error),
          });
        }
      }

      const destinationFailures = failures.filter((f) => f.needsDestinationFix);
      if (destinationFailures.length > 0) {
        const names = destinationFailures.map(
          ({ repoPath }) => repoPath.split('/').pop() || repoPath,
        );
        const prompt = `Some repos have no push destination:\n${names.join('\n')}\n\nCreate a new private GitHub repo (if needed) and retry push?`;
        if (window.confirm(prompt)) {
          const retriedFailures: typeof failures = [];
          for (const failure of destinationFailures) {
            try {
              await window.electron.repoService.createPrivateRepoAndPush(
                failure.repoPath,
              );
            } catch (error: unknown) {
              retriedFailures.push({
                repoPath: failure.repoPath,
                message: summarizeSyncError(error),
                needsDestinationFix: false,
              });
            }
          }
          failures = failures.filter((f) => !f.needsDestinationFix);
          failures.push(...retriedFailures);
        }
      }

      await fetchDiff();

      if (failures.length > 0) {
        const maxShown = 5;
        const shown = failures
          .slice(0, maxShown)
          .map(({ repoPath, message }) => {
            const name = repoPath.split('/').pop() || repoPath;
            return `${name}: ${message}`;
          });
        const extra =
          failures.length > maxShown
            ? `\n...and ${failures.length - maxShown} more.`
            : '';
        window.alert(
          `Sync completed with errors (${repoPaths.length - failures.length}/${repoPaths.length} repos synced):\n${shown.join('\n')}${extra}`,
        );
      }
    } finally {
      setPushingAll(false);
    }
  }, [repositories, fetchDiff]);

  const fileContextActions: ContextMenuAction[] = useMemo(() => {
    const shared = getContextMenuActions(repoPath);
    return shared.map((action) => ({
      label: action.label,
      onClick: (target: { repoPath: string; displayPath?: string }) => {
        const fullPath = target.displayPath
          ? `${target.repoPath}/${target.displayPath}`
          : target.repoPath;
        action.onClick(target.repoPath, fullPath);
      },
    }));
  }, [repoPath]);

  const showNativeContextMenu = useCallback(
    (items: NativeContextMenuItem[]) => {
      return window.electron.repoService.showContextMenu(items);
    },
    [],
  );

  const handleOpenRepoInGitHubWeb = useCallback(
    async (selectedRepoPath: string) => {
      try {
        await window.electron.repoService.openInGitHubWeb(selectedRepoPath);
      } catch {
        const name = selectedRepoPath.split('/').pop() || selectedRepoPath;
        window.alert(
          `Unable to open GitHub web URL for ${name}. Ensure the origin remote points to GitHub.`,
        );
      }
    },
    [],
  );

  const loadHistoryGroupDiff = useCallback(async (group: HistoryGroup) => {
    return window.electron.repoService.getHistoryGroupDiff(
      group.commits.map((commit) => ({
        repoPath: commit.repoPath,
        repoName: commit.repoName,
        hash: commit.hash,
      })),
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      <DiffViewer
        repositories={repositories}
        loading={loading}
        title={repoName}
        onRefresh={fetchDiff}
        onPushAll={handlePushAll}
        pushingAll={pushingAll}
        showPushIndicator={hasPushableChanges}
        onBack={() => navigate('/')}
        onOpenRepoInGitHubWeb={handleOpenRepoInGitHubWeb}
        fileContextActions={fileContextActions}
        onDiscard={handleDiscard}
        selections={selections}
        onSelectionChange={(fileKey, selection) =>
          setSelections((prev) => ({ ...prev, [fileKey]: selection }))
        }
        historyGroups={historyGroups}
        historyLoading={historyLoading}
        loadHistoryGroupDiff={loadHistoryGroupDiff}
        commitPanel={
          entries.length > 0 ? (
            <CommitPanel
              repoNames={reposWithChanges}
              onCommit={handleStageAndCommit}
              onGenerateSingleMessage={handleGenerateSingleMessage}
              onGenerateRepoMessage={handleGenerateRepoMessage}
              summary={summary}
              committing={committing}
            />
          ) : undefined
        }
        showNativeContextMenu={showNativeContextMenu}
      />
    </div>
  );
}
