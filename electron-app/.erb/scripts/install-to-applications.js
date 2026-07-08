const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..', '..');
const buildRoot = path.join(projectRoot, 'release', 'build');
const preferredOutputDirs = ['mac-arm64', 'mac'];
const quitTimeoutSeconds = 15;

function escapeAppleScriptString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function isAppRunning(appDisplayName) {
  const escapedName = escapeAppleScriptString(appDisplayName);
  const output = execFileSync(
    'osascript',
    ['-e', `application "${escapedName}" is running`],
    {
      encoding: 'utf8',
    },
  );

  return output.trim().toLowerCase() === 'true';
}

function sleep(seconds) {
  execFileSync('sleep', [String(seconds)]);
}

function quitAppIfRunning(appDisplayName) {
  if (!isAppRunning(appDisplayName)) {
    return;
  }

  const escapedName = escapeAppleScriptString(appDisplayName);
  console.log(`${appDisplayName} is running. Quitting before install...`);
  execFileSync('osascript', ['-e', `tell application "${escapedName}" to quit`], {
    stdio: 'inherit',
  });

  for (let second = 0; second < quitTimeoutSeconds; second += 1) {
    if (!isAppRunning(appDisplayName)) {
      console.log(`${appDisplayName} closed.`);
      return;
    }
    sleep(1);
  }

  throw new Error(
    `${appDisplayName} is still running after ${quitTimeoutSeconds} seconds. Close it and try again.`,
  );
}

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
  const appDisplayName = path.basename(appBundlePath, '.app');
  const destinationPath = path.join('/Applications', appName);

  console.log(`Installing ${appName} to ${destinationPath}...`);

  quitAppIfRunning(appDisplayName);
  fs.rmSync(destinationPath, { recursive: true, force: true });
  execFileSync('cp', ['-R', appBundlePath, '/Applications/'], {
    stdio: 'inherit',
  });
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', destinationPath], {
    stdio: 'inherit',
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
