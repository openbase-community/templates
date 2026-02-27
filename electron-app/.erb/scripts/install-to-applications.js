const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const buildRoot = path.join(projectRoot, 'release', 'build');
const preferredOutputDirs = ['mac-arm64', 'mac'];

function listAppBundles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('.app'))
    .map((entry) => path.join(dirPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function findBuiltAppBundle() {
  for (const outputDir of preferredOutputDirs) {
    const appBundles = listAppBundles(path.join(buildRoot, outputDir));
    if (appBundles.length > 0) {
      return appBundles[0];
    }
  }

  const fallbackAppBundles = listAppBundles(buildRoot);
  if (fallbackAppBundles.length > 0) {
    return fallbackAppBundles[0];
  }

  return null;
}

function installAppToApplications(appBundlePath) {
  const appName = path.basename(appBundlePath);
  const destinationPath = path.join('/Applications', appName);

  console.log(`Installing ${appName} to ${destinationPath}...`);

  fs.rmSync(destinationPath, { recursive: true, force: true });
  fs.cpSync(appBundlePath, destinationPath, {
    recursive: true,
    force: true,
    dereference: true,
  });

  console.log(`Installed ${appName} to /Applications`);
}

function main() {
  const appBundlePath = findBuiltAppBundle();

  if (!appBundlePath) {
    throw new Error(
      `No .app bundle found under ${buildRoot}. Run a mac directory build first.`,
    );
  }

  installAppToApplications(appBundlePath);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to install app to /Applications: ${message}`);
  process.exit(1);
}
