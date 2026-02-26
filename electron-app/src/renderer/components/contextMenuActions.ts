interface ContextMenuActionDef {
  label: string;
  onClick: (repoPath: string, filePath?: string) => void;
}

/**
 * Shared context menu action definitions for repo items.
 * @param rootRepoPath - The workspace/root repo path (used for "Open in Cursor" workspace arg)
 */
export function getContextMenuActions(
  rootRepoPath?: string,
): ContextMenuActionDef[] {
  return [
    {
      label: 'Reveal in Finder',
      onClick: (repoPath, filePath) => {
        window.electron.repoService.revealInFinder(filePath ?? repoPath);
      },
    },
    {
      label: 'Open in Cursor',
      onClick: (repoPath, filePath) => {
        window.electron.repoService.openInCursor(
          rootRepoPath ?? repoPath,
          filePath ?? repoPath,
        );
      },
    },
    {
      label: 'Copy Path',
      onClick: (_repoPath, filePath) => {
        navigator.clipboard.writeText(filePath ?? _repoPath);
      },
    },
    {
      label: 'Open in GitHub Desktop',
      onClick: (repoPath) => {
        window.electron.repoService.openInGitHubDesktop(repoPath);
      },
    },
  ];
}
