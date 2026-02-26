import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  NativeContextMenuItem,
  HistoryGroup,
  HistoryCommitRef,
  HistoryRepoDiff,
} from 'multi-react';

export interface NavigateToRepoPayload {
  repoPath: string;
  filePath?: string;
}

const electronHandler = {
  repoService: {
    getRepos: () =>
      ipcRenderer.invoke('repo:getRepos') as Promise<
        { path: string; name?: string }[]
      >,
    getRepoStatus: (repoPath: string) =>
      ipcRenderer.invoke('repo:getRepoStatus', repoPath) as Promise<
        'clean' | 'dirty' | 'out-of-sync' | 'not-a-repo' | 'missing'
      >,
    getRepoSyncState: (repoPath: string) =>
      ipcRenderer.invoke('repo:getRepoSyncState', repoPath) as Promise<{
        ahead: number;
        behind: number;
        hasUpstream: boolean;
        isRepo: boolean;
      }>,
    getRepoDiff: (repoPath: string) =>
      ipcRenderer.invoke('repo:getRepoDiff', repoPath) as Promise<string>,
    getCombinedHistory: (repoPath: string) =>
      ipcRenderer.invoke('repo:getCombinedHistory', repoPath) as Promise<
        HistoryGroup[]
      >,
    getHistoryGroupDiff: (commits: HistoryCommitRef[]) =>
      ipcRenderer.invoke('repo:getHistoryGroupDiff', commits) as Promise<
        HistoryRepoDiff[]
      >,
    getSubRepos: (repoPath: string) =>
      ipcRenderer.invoke('repo:getSubRepos', repoPath) as Promise<
        { name: string; path: string }[] | null
      >,
    addRepo: (repoPath: string) =>
      ipcRenderer.invoke('repo:addRepo', repoPath) as Promise<void>,
    removeRepo: (repoPath: string) =>
      ipcRenderer.invoke('repo:removeRepo', repoPath) as Promise<void>,
    pickDirectory: () =>
      ipcRenderer.invoke('repo:pickDirectory') as Promise<string | null>,
    openInGitHubDesktop: (repoPath: string) =>
      ipcRenderer.invoke('repo:openInGitHubDesktop', repoPath) as Promise<void>,
    openInGitHubWeb: (repoPath: string) =>
      ipcRenderer.invoke('repo:openInGitHubWeb', repoPath) as Promise<void>,
    revealInFinder: (filePath: string) =>
      ipcRenderer.invoke('repo:revealInFinder', filePath) as Promise<void>,
    openInCursor: (repoPath: string, filePath: string) =>
      ipcRenderer.invoke('repo:openInCursor', repoPath, filePath) as Promise<void>,
    showContextMenu: (items: NativeContextMenuItem[]) =>
      ipcRenderer.invoke('repo:showContextMenu', items) as Promise<string | null>,
    getConfigPath: () =>
      ipcRenderer.invoke('repo:getConfigPath') as Promise<string>,
    setConfigPath: (newPath: string) =>
      ipcRenderer.invoke('repo:setConfigPath', newPath) as Promise<void>,
    getOpenAIApiKey: () =>
      ipcRenderer.invoke('repo:getOpenAIApiKey') as Promise<string>,
    setOpenAIApiKey: (apiKey: string) =>
      ipcRenderer.invoke('repo:setOpenAIApiKey', apiKey) as Promise<void>,
    stageChanges: (repoPath: string, patch: string) =>
      ipcRenderer.invoke('repo:stageChanges', repoPath, patch) as Promise<void>,
    stageFiles: (repoPath: string, filePaths: string[]) =>
      ipcRenderer.invoke('repo:stageFiles', repoPath, filePaths) as Promise<void>,
    commit: (repoPath: string, message: string) =>
      ipcRenderer.invoke('repo:commit', repoPath, message) as Promise<void>,
    push: (repoPath: string) =>
      ipcRenderer.invoke('repo:push', repoPath) as Promise<void>,
    createPrivateRepoAndPush: (repoPath: string) =>
      ipcRenderer.invoke('repo:createPrivateRepoAndPush', repoPath) as Promise<void>,
    generateCommitMessage: (diff: string) =>
      ipcRenderer.invoke('repo:generateCommitMessage', diff) as Promise<string>,
    discardFile: (repoPath: string, filePath: string, isNew: boolean) =>
      ipcRenderer.invoke('repo:discardFile', repoPath, filePath, isNew) as Promise<void>,
    discardLines: (repoPath: string, patch: string) =>
      ipcRenderer.invoke('repo:discardLines', repoPath, patch) as Promise<void>,
  },
  onNavigateToRepo: (callback: (payload: NavigateToRepoPayload) => void) => {
    const subscription = (
      _event: IpcRendererEvent,
      payload: string | NavigateToRepoPayload,
    ) => {
      if (typeof payload === 'string') {
        callback({ repoPath: payload });
        return;
      }
      callback(payload);
    };
    ipcRenderer.on('navigate-to-repo', subscription);
    return () => {
      ipcRenderer.removeListener('navigate-to-repo', subscription);
    };
  },
  onNavigateToSettings: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on('navigate-to-settings', subscription);
    return () => {
      ipcRenderer.removeListener('navigate-to-settings', subscription);
    };
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
