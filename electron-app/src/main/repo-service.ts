import {
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Menu,
  MenuItemConstructorOptions,
} from 'electron';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type {
  HistoryCommit,
  HistoryGroup,
  HistoryCommitRef,
  HistoryRepoDiff,
  NativeContextMenuItem,
} from 'multi-react';

const execFileAsync = promisify(execFile);

interface RepoEntry {
  path: string;
  name?: string;
}

interface RepoSyncState {
  ahead: number;
  behind: number;
  hasUpstream: boolean;
  isRepo: boolean;
}

interface AppSettings {
  openAIApiKey?: string;
}

const HISTORY_GROUP_WINDOW_MS = 60_000;
const HISTORY_MAX_COMMITS_PER_REPO = 250;
const GIT_HISTORY_FORMAT = '%H%x1f%h%x1f%an%x1f%ae%x1f%at%x1f%s%x1f%b%x1e';

const defaultConfigPath = path.join(os.homedir(), '.multi', 'repos.json');
const openbaseConfigPath = path.join(os.homedir(), '.openbase', 'coder-projects.json');
const settingsPath = path.join(os.homedir(), '.multi', 'settings.json');

// Use openbase config if it exists, otherwise fall back to default
let configPath = fs.existsSync(openbaseConfigPath)
  ? openbaseConfigPath
  : defaultConfigPath;

type GitExecOptions = {
  cwd: string;
  timeout?: number;
};

async function execGit(
  args: string[],
  { cwd, timeout = 30000 }: GitExecOptions,
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync('git', args, { cwd, timeout });
}

async function getGitTopLevel(repoPath: string): Promise<string | null> {
  try {
    const { stdout } = await execGit(['rev-parse', '--show-toplevel'], {
      cwd: repoPath,
      timeout: 30000,
    });
    const topLevel = stdout.trim();
    return topLevel.length > 0 ? topLevel : null;
  } catch {
    return null;
  }
}

async function isGitRepoRoot(repoPath: string): Promise<boolean> {
  const topLevel = await getGitTopLevel(repoPath);
  if (!topLevel) return false;
  return path.resolve(topLevel) === path.resolve(repoPath);
}

async function runGitWithInput(
  args: string[],
  input: string,
  { cwd, timeout = 30000 }: GitExecOptions,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn('git', [...args, '-'], { cwd, timeout });
    let stderr = '';
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`git ${args.join(' ')} failed (code ${code}): ${stderr}`));
    });
    proc.stdin.write(input);
    proc.stdin.end();
  });
}

function readSettings(): AppSettings {
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as AppSettings;
  } catch {
    return {};
  }
}

function writeSettings(next: AppSettings): void {
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(settingsPath, JSON.stringify(next, null, 2));
}

function readRepos(): RepoEntry[] {
  if (!fs.existsSync(configPath)) {
    return [];
  }
  let raw: { path: string }[];
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return [];
  }
  return raw.map((e) => ({
    path: e.path,
    name: e.path.split('/').pop() || e.path,
  }));
}

export type RepoStatus = 'clean' | 'dirty' | 'out-of-sync' | 'not-a-repo' | 'missing';

const STATUS_SEVERITY: Record<RepoStatus, number> = {
  clean: 0,
  'not-a-repo': 1,
  'out-of-sync': 2,
  dirty: 3,
  missing: 4,
};

async function getGitStatus(repoPath: string): Promise<RepoStatus> {
  return getGitStatusInternal(repoPath, { ignoreUntracked: false });
}

type GitStatusOptions = {
  ignoreUntracked: boolean;
};

async function getGitStatusInternal(
  repoPath: string,
  options: GitStatusOptions,
): Promise<RepoStatus> {
  if (!fs.existsSync(repoPath)) {
    return 'missing';
  }

  const gitDir = path.join(repoPath, '.git');
  if (!fs.existsSync(gitDir)) {
    return 'not-a-repo';
  }

  // Check for uncommitted changes
  const statusArgs = options.ignoreUntracked
    ? ['status', '--porcelain', '--untracked-files=no']
    : ['status', '--porcelain'];
  const { stdout: porcelain } = await execGit(statusArgs, {
    cwd: repoPath,
    timeout: 10000,
  });
  if (porcelain.trim().length > 0) {
    return 'dirty';
  }

  // Check ahead/behind upstream
  try {
    const { stdout: revList } = await execGit(
      ['rev-list', '--left-right', '--count', 'HEAD...@{u}'],
      { cwd: repoPath, timeout: 10000 },
    );
    const [ahead, behind] = revList.trim().split(/\s+/).map(Number);
    if (ahead > 0 || behind > 0) {
      return 'out-of-sync';
    }
  } catch {
    // No upstream branch configured
    return 'out-of-sync';
  }

  return 'clean';
}

async function getRepoSyncState(repoPath: string): Promise<RepoSyncState> {
  if (!fs.existsSync(repoPath)) {
    return { ahead: 0, behind: 0, hasUpstream: false, isRepo: false };
  }

  const gitDir = path.join(repoPath, '.git');
  if (!fs.existsSync(gitDir)) {
    return { ahead: 0, behind: 0, hasUpstream: false, isRepo: false };
  }

  try {
    const { stdout: revList } = await execGit(
      ['rev-list', '--left-right', '--count', 'HEAD...@{u}'],
      { cwd: repoPath, timeout: 10000 },
    );
    const [ahead, behind] = revList.trim().split(/\s+/).map(Number);
    return {
      ahead: Number.isFinite(ahead) ? ahead : 0,
      behind: Number.isFinite(behind) ? behind : 0,
      hasUpstream: true,
      isRepo: true,
    };
  } catch {
    return { ahead: 0, behind: 0, hasUpstream: false, isRepo: true };
  }
}

function worstStatus(a: RepoStatus, b: RepoStatus): RepoStatus {
  return STATUS_SEVERITY[a] >= STATUS_SEVERITY[b] ? a : b;
}

async function getStatusForRepo(repoPath: string): Promise<RepoStatus> {
  // Check if this is a multi workspace with sub-repos
  const subRepos = getSubRepos(repoPath);
  if (subRepos && subRepos.length > 0) {
    const statuses = await Promise.all([
      // For multi workspace roots, ignore untracked entries at the root level.
      // This avoids external symlink folders (not listed in multi.json) marking the whole project dirty.
      getGitStatusInternal(repoPath, { ignoreUntracked: true }),
      ...subRepos.map((sub) => getGitStatus(sub.path)),
    ]);
    let worst: RepoStatus = statuses[0];
    // If root is not a git repo itself, start from clean
    if (worst === 'not-a-repo' || worst === 'missing') worst = 'clean';
    for (let i = 1; i < statuses.length; i += 1) {
      const subStatus = statuses[i];
      // Skip sub-repos that don't exist or aren't cloned yet
      if (subStatus === 'missing' || subStatus === 'not-a-repo') continue;
      worst = worstStatus(worst, subStatus);
    }
    return worst;
  }
  return getGitStatus(repoPath);
}

function addRepo(repoPath: string): void {
  let raw: { path: string }[] = [];
  if (fs.existsSync(configPath)) {
    try {
      raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      raw = [];
    }
  } else {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  if (raw.some((e) => e.path === repoPath)) return;
  raw.push({ path: repoPath });
  fs.writeFileSync(configPath, JSON.stringify(raw, null, 2));
}

function removeRepo(repoPath: string): void {
  if (!fs.existsSync(configPath)) return;
  let raw: { path: string }[];
  try {
    raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return;
  }
  const filtered = raw.filter((e) => e.path !== repoPath);
  fs.writeFileSync(configPath, JSON.stringify(filtered, null, 2));
}

interface SubRepo {
  name: string;
  path: string;
}

function getSubRepos(repoPath: string): SubRepo[] | null {
  const multiJsonPath = path.join(repoPath, 'multi.json');
  if (!fs.existsSync(multiJsonPath)) return null;
  let config: { repos?: { name?: string; url?: string }[] };
  try {
    config = JSON.parse(fs.readFileSync(multiJsonPath, 'utf-8'));
  } catch {
    return null;
  }
  const repos: SubRepo[] = (config.repos || []).map(
    (r: { name?: string; url?: string }) => {
      const name =
        r.name || (r.url ? r.url.replace(/\.git$/, '').split('/').pop() : '');
      return { name, path: path.join(repoPath, name) };
    },
  );
  repos.sort((a, b) => a.name.localeCompare(b.name));
  return repos;
}

async function getDiffForRepo(repoPath: string): Promise<string> {
  // Verify this directory is actually the root of a git repo, not a
  // subdirectory of a parent repo (which would return the parent's diff).
  if (!(await isGitRepoRoot(repoPath))) {
    return '';
  }

  const opts = { cwd: repoPath, timeout: 30000 };

  // Combine unstaged + staged diffs for tracked files
  const [{ stdout: unstaged }, { stdout: staged }, { stdout: untrackedList }] =
    await Promise.all([
      execGit(['diff'], opts),
      execGit(['diff', '--cached'], opts),
      execGit(['ls-files', '--others', '--exclude-standard'], opts),
    ]);

  // Include untracked files as "new file" diffs
  const untrackedFiles = untrackedList.trim().split('\n').filter(Boolean);

  const untrackedDiffs = await Promise.all(
    untrackedFiles.map(async (file) => {
      try {
        // git diff --no-index exits with code 1 when files differ, which is expected
        await execGit(['diff', '--no-index', '--', '/dev/null', file], opts);
        return '';
      } catch (e: unknown) {
        // Exit code 1 means diff found — stdout contains the diff
        const err = e as { stdout?: string };
        return err.stdout ?? '';
      }
    }),
  );

  return unstaged + staged + untrackedDiffs.join('');
}

async function getHistoryForRepo(
  repoPath: string,
  repoName: string,
): Promise<HistoryCommit[]> {
  if (!fs.existsSync(repoPath)) return [];
  if (!(await isGitRepoRoot(repoPath))) {
    return [];
  }

  const opts = { cwd: repoPath, timeout: 30000 };
  let stdout = '';
  try {
    const result = await execGit(
      [
        'log',
        '--date-order',
        `--max-count=${HISTORY_MAX_COMMITS_PER_REPO}`,
        `--pretty=format:${GIT_HISTORY_FORMAT}`,
      ],
      opts,
    );
    stdout = result.stdout;
  } catch {
    return [];
  }

  if (!stdout.trim()) return [];

  return stdout
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record): HistoryCommit | null => {
      const [
        hash,
        shortHash,
        authorName,
        authorEmail,
        authoredAtUnix,
        subject,
        ...descriptionParts
      ] = record.split('\x1f');

      const description = descriptionParts
        .join('\x1f')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? '';

      const authoredAtSeconds = Number(authoredAtUnix);
      if (
        !hash ||
        !shortHash ||
        !subject ||
        !Number.isFinite(authoredAtSeconds)
      ) {
        return null;
      }

      const authoredAtMs = authoredAtSeconds * 1000;
      return {
        hash,
        shortHash,
        subject,
        description,
        authorName: authorName ?? '',
        authorEmail: authorEmail ?? '',
        authoredAtMs,
        authoredAtIso: new Date(authoredAtMs).toISOString(),
        repoPath,
        repoName,
      };
    })
    .filter((entry): entry is HistoryCommit => entry !== null);
}

function groupHistoryCommits(commits: HistoryCommit[]): HistoryGroup[] {
  if (commits.length === 0) return [];

  const sorted = [...commits].sort((a, b) => {
    if (a.authoredAtMs !== b.authoredAtMs) {
      return b.authoredAtMs - a.authoredAtMs;
    }
    return b.hash.localeCompare(a.hash);
  });

  const groups: HistoryGroup[] = [];

  for (const commit of sorted) {
    const currentGroup = groups[groups.length - 1];
    const previousCommit = currentGroup?.commits[currentGroup.commits.length - 1];
    const shouldMerge =
      previousCommit !== undefined &&
      Math.abs(previousCommit.authoredAtMs - commit.authoredAtMs) <=
        HISTORY_GROUP_WINDOW_MS;

    if (currentGroup && shouldMerge) {
      currentGroup.commits.push(commit);
      currentGroup.oldestAuthoredAtMs = commit.authoredAtMs;
      if (!currentGroup.repoNames.includes(commit.repoName)) {
        currentGroup.repoNames.push(commit.repoName);
      }
      continue;
    }

    groups.push({
      id: `${commit.authoredAtMs}-${commit.hash}`,
      newestAuthoredAtMs: commit.authoredAtMs,
      oldestAuthoredAtMs: commit.authoredAtMs,
      authoredAtIso: commit.authoredAtIso,
      repoNames: [commit.repoName],
      commits: [commit],
    });
  }

  return groups;
}

async function getCombinedHistory(repoPath: string): Promise<HistoryGroup[]> {
  const repos: SubRepo[] = [
    {
      name: path.basename(repoPath) || repoPath,
      path: repoPath,
    },
    ...(getSubRepos(repoPath) ?? []),
  ];

  const uniqueRepos = repos.filter(
    (repo, index, allRepos) =>
      allRepos.findIndex(
        (other) => path.resolve(other.path) === path.resolve(repo.path),
      ) === index,
  );

  const histories = await Promise.all(
    uniqueRepos.map((repo) => getHistoryForRepo(repo.path, repo.name)),
  );

  return groupHistoryCommits(histories.flat());
}

async function getHistoryGroupDiff(
  commits: HistoryCommitRef[],
): Promise<HistoryRepoDiff[]> {
  if (commits.length === 0) return [];

  const byRepo = new Map<string, { repoPath: string; repoName: string; hashes: string[] }>();

  for (const commit of commits) {
    const key = `${path.resolve(commit.repoPath)}::${commit.repoName}`;
    const existing = byRepo.get(key);
    if (existing) {
      existing.hashes.push(commit.hash);
      continue;
    }
    byRepo.set(key, {
      repoPath: commit.repoPath,
      repoName: commit.repoName,
      hashes: [commit.hash],
    });
  }

  const repoDiffs = await Promise.all(
    [...byRepo.values()].map(async (repo): Promise<HistoryRepoDiff | null> => {
      const diffs = await Promise.all(
        repo.hashes.map(async (hash) => {
          try {
            const { stdout } = await execGit(
              ['show', '--format=', '--no-color', hash],
              { cwd: repo.repoPath, timeout: 30000 },
            );
            return stdout.trim();
          } catch {
            return '';
          }
        }),
      );

      const combinedDiff = diffs.filter(Boolean).join('\n');
      if (!combinedDiff) return null;

      return {
        repoPath: repo.repoPath,
        repoName: repo.repoName,
        diff: combinedDiff,
      };
    }),
  );

  return repoDiffs.filter((entry): entry is HistoryRepoDiff => entry !== null);
}

function toGitHubWebUrl(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('git@github.com:')) {
    const slug = trimmed
      .slice('git@github.com:'.length)
      .replace(/\.git$/, '');
    return slug ? `https://github.com/${slug}` : null;
  }

  if (trimmed.startsWith('ssh://git@github.com/')) {
    const slug = trimmed
      .slice('ssh://git@github.com/'.length)
      .replace(/\.git$/, '');
    return slug ? `https://github.com/${slug}` : null;
  }

  if (
    trimmed.startsWith('https://github.com/') ||
    trimmed.startsWith('http://github.com/')
  ) {
    return trimmed.replace(/^http:\/\//, 'https://').replace(/\.git$/, '');
  }

  return null;
}

async function openRepoInGitHubWeb(repoPath: string): Promise<void> {
  const { stdout } = await execGit(['remote', 'get-url', 'origin'], {
    cwd: repoPath,
    timeout: 10000,
  });
  const githubUrl = toGitHubWebUrl(stdout);
  if (!githubUrl) {
    throw new Error('Repository origin is not a GitHub URL.');
  }
  await shell.openExternal(githubUrl);
}

export function registerRepoHandlers() {
  ipcMain.handle('repo:getRepos', () => {
    return readRepos();
  });

  ipcMain.handle('repo:getRepoStatus', (_event, repoPath: string) => {
    return getStatusForRepo(repoPath);
  });

  ipcMain.handle('repo:getRepoSyncState', (_event, repoPath: string) => {
    return getRepoSyncState(repoPath);
  });

  ipcMain.handle('repo:getRepoDiff', (_event, repoPath: string) => {
    return getDiffForRepo(repoPath);
  });

  ipcMain.handle('repo:getCombinedHistory', (_event, repoPath: string) => {
    return getCombinedHistory(repoPath);
  });

  ipcMain.handle(
    'repo:getHistoryGroupDiff',
    (_event, commits: HistoryCommitRef[]) => {
      return getHistoryGroupDiff(commits);
    },
  );

  ipcMain.handle(
    'repo:getSubRepos',
    (_event, repoPath: string): SubRepo[] | null => {
      return getSubRepos(repoPath);
    },
  );

  ipcMain.handle(
    'repo:showContextMenu',
    (
      event,
      items: NativeContextMenuItem[],
    ): Promise<string | null> | null => {
      if (!items.length) return null;

      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) return null;

      return new Promise((resolve) => {
        let settled = false;
        const settle = (selectedId: string | null) => {
          if (settled) return;
          settled = true;
          resolve(selectedId);
        };

        const template: MenuItemConstructorOptions[] = items.map((item) => {
          if (item.type === 'separator') {
            return { type: 'separator' };
          }

          return {
            label: item.label ?? '',
            enabled: item.enabled ?? true,
            click: () => settle(item.id ?? null),
          };
        });

        const menu = Menu.buildFromTemplate(template);
        menu.popup({
          window,
          callback: () => settle(null),
        });
      });
    },
  );

  ipcMain.handle('repo:openInGitHubDesktop', (_event, repoPath: string) => {
    spawn('github', [repoPath], { detached: true, stdio: 'ignore' }).unref();
  });

  ipcMain.handle('repo:openInGitHubWeb', (_event, repoPath: string) => {
    return openRepoInGitHubWeb(repoPath);
  });

  ipcMain.handle('repo:revealInFinder', (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle(
    'repo:openInCursor',
    (_event, repoPath: string, filePath: string) => {
      spawn('cursor', [repoPath, filePath], {
        detached: true,
        stdio: 'ignore',
      }).unref();
    },
  );

  ipcMain.handle('repo:addRepo', (_event, repoPath: string) => {
    addRepo(repoPath);
  });

  ipcMain.handle('repo:removeRepo', (_event, repoPath: string) => {
    removeRepo(repoPath);
  });

  ipcMain.handle('repo:pickDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('repo:getConfigPath', () => {
    return configPath;
  });

  ipcMain.handle('repo:setConfigPath', (_event, newPath: string) => {
    configPath = newPath;
  });

  ipcMain.handle('repo:getOpenAIApiKey', () => {
    return readSettings().openAIApiKey ?? '';
  });

  ipcMain.handle('repo:setOpenAIApiKey', (_event, apiKey: string) => {
    const settings = readSettings();
    const trimmed = apiKey.trim();
    settings.openAIApiKey = trimmed.length > 0 ? trimmed : '';
    writeSettings(settings);
  });

  ipcMain.handle(
    'repo:stageChanges',
    async (_event, repoPath: string, patch: string): Promise<void> => {
      const opts = { cwd: repoPath, timeout: 30000 };
      // Reset index to start clean
      await execGit(['reset', 'HEAD'], opts).catch(() => {
        // Ignore error if nothing staged or initial commit
      });
      await runGitWithInput(
        ['apply', '--cached', '--unidiff-zero', '--whitespace=nowarn'],
        patch,
        opts,
      );
    },
  );

  ipcMain.handle(
    'repo:stageFiles',
    async (_event, repoPath: string, filePaths: string[]): Promise<void> => {
      if (filePaths.length === 0) return;
      await execGit(['add', '--', ...filePaths], {
        cwd: repoPath,
        timeout: 30000,
      });
    },
  );

  ipcMain.handle(
    'repo:commit',
    async (_event, repoPath: string, message: string): Promise<void> => {
      await execGit(['commit', '-m', message], {
        cwd: repoPath,
        timeout: 30000,
      });
    },
  );

  ipcMain.handle(
    'repo:push',
    async (_event, repoPath: string): Promise<void> => {
      // Skip non-repo paths (multi workspace roots may include non-git roots).
      const status = await getGitStatus(repoPath);
      if (status === 'missing' || status === 'not-a-repo') return;
      const opts = { cwd: repoPath, timeout: 120000 };

      // Pull only when safe: clean worktree + fast-forward only.
      if (status !== 'dirty') {
        try {
          await execGit(['pull', '--ff-only'], opts);
        } catch {
          // Unsafe or unavailable pull (e.g. no upstream / non-ff). Continue to push.
        }
      }

      await execGit(['push'], {
        cwd: opts.cwd,
        timeout: opts.timeout,
      });
    },
  );

  ipcMain.handle(
    'repo:createPrivateRepoAndPush',
    async (_event, repoPath: string): Promise<void> => {
      const status = await getGitStatus(repoPath);
      if (status === 'missing' || status === 'not-a-repo') {
        throw new Error('Repository path is missing or not a git repo.');
      }

      const opts = { cwd: repoPath, timeout: 120000 };

      // If origin exists, just set upstream and push.
      let hasOrigin = true;
      try {
        await execGit(['remote', 'get-url', 'origin'], opts);
      } catch {
        hasOrigin = false;
      }

      if (!hasOrigin) {
        const repoName = path.basename(repoPath);
        try {
          await execFileAsync(
            'gh',
            ['repo', 'create', repoName, '--private', '--source', '.', '--remote', 'origin'],
            opts,
          );
        } catch (e: unknown) {
          const err = e as { stderr?: string; message?: string };
          const stderr = (err.stderr ?? '').trim();
          const msg = (err.message ?? '').trim();
          const details = stderr || msg || 'Unknown error creating GitHub repository.';
          throw new Error(
            `Failed to create private GitHub repo. Ensure gh CLI is installed and authenticated. ${details}`,
          );
        }
      }

      await execGit(['push', '-u', 'origin', 'HEAD'], opts);
    },
  );

  ipcMain.handle(
    'repo:generateCommitMessage',
    async (_event, diff: string): Promise<string> => {
      const trimmedDiff = diff.trim();
      if (!trimmedDiff) {
        throw new Error('No selected changes to summarize.');
      }

      const apiKey = (readSettings().openAIApiKey ?? '').trim();
      if (!apiKey) {
        throw new Error('OpenAI API key not set. Add it in Settings.');
      }

      const maxDiffChars = 18000;
      const diffForModel =
        trimmedDiff.length > maxDiffChars
          ? `${trimmedDiff.slice(0, maxDiffChars)}\n\n[Diff truncated for size]`
          : trimmedDiff;

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          max_tokens: 120,
          messages: [
            {
              role: 'system',
              content:
                'You write concise git commit messages. Return only one line, imperative mood, no trailing period, max 72 chars.',
            },
            {
              role: 'user',
              content: `Write a commit message for this diff:\n\n${diffForModel}`,
            },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        const concise = errText.replace(/\s+/g, ' ').trim().slice(0, 240);
        throw new Error(`OpenAI error (${resp.status}): ${concise}`);
      }

      const data = (await resp.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content ?? '';
      const firstLine = raw
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0);

      if (!firstLine) {
        throw new Error('OpenAI returned an empty commit message.');
      }

      return firstLine.slice(0, 120);
    },
  );

  ipcMain.handle(
    'repo:discardFile',
    async (_event, repoPath: string, filePath: string, isNew: boolean): Promise<void> => {
      const opts = { cwd: repoPath, timeout: 30000 };
      if (isNew) {
        const fullPath = path.join(repoPath, filePath);
        await fs.promises.unlink(fullPath);
      } else {
        await execGit(['checkout', '--', filePath], opts);
      }
    },
  );

  ipcMain.handle(
    'repo:discardLines',
    async (_event, repoPath: string, patch: string): Promise<void> => {
      // --- DEBUG LOGGING ---
      console.log('[discardLines] repoPath:', repoPath);
      console.log('[discardLines] patch being applied:');
      console.log(patch);
      console.log('[discardLines] patch bytes:', Buffer.from(patch).toString('hex').match(/../g)?.slice(0, 200)?.join(' '));
      // --- END DEBUG ---

      await runGitWithInput(
        ['apply', '--unidiff-zero', '--whitespace=nowarn'],
        patch,
        { cwd: repoPath, timeout: 30000 },
      ).catch((error) => {
        console.log('[discardLines] git apply failed:', error);
        throw error;
      });
    },
  );
}
