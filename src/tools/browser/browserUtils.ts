// Browser utility functions for finding Chrome/Chromium executables

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { platform } from 'os';

/**
 * Finds Chrome or Chromium executable path on the system
 */
export function findChromePath(): string | undefined {
  const platformName = platform();
  
  // Platform-specific paths for Chrome
  const chromePaths: Record<string, string[]> = {
    win32: [
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ],
    linux: [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ]
  };
  
  // Platform-specific paths for Edge (as fallback)
  const edgePaths: Record<string, string[]> = {
    win32: [
      process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
      process.env.PROGRAMFILES + '\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
    darwin: [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ],
    linux: [
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
    ]
  };
  
  // Platform-specific paths for Brave (as fallback)
  const bravePaths: Record<string, string[]> = {
    win32: [
      process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      process.env.PROGRAMFILES + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      process.env['PROGRAMFILES(X86)'] + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    ],
    darwin: [
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ],
    linux: [
      '/usr/bin/brave-browser',
      '/usr/bin/brave',
      '/snap/bin/brave',
    ]
  };
  
  // Check user-specified path first
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  
  // Get paths for current platform
  const currentPlatform = platformName === 'win32' ? 'win32' : 
                         platformName === 'darwin' ? 'darwin' : 'linux';
  
  const allPaths = [
    ...(chromePaths[currentPlatform] || []),
    ...(edgePaths[currentPlatform] || []),
    ...(bravePaths[currentPlatform] || [])
  ];
  
  // Find first existing path
  for (const path of allPaths) {
    if (path && existsSync(path)) {
      return path;
    }
  }
  
  // Try to find Chrome using 'which' command on Unix systems
  if (platformName !== 'win32') {
    try {
      const chromePath = execSync('which google-chrome || which chromium || which chromium-browser', {
        encoding: 'utf8'
      }).trim();
      if (chromePath && existsSync(chromePath)) {
        return chromePath;
      }
    } catch {
      // Command failed, continue to next method
    }
  }
  
  // Try to find Chrome using 'where' command on Windows
  if (platformName === 'win32') {
    try {
      const chromePath = execSync('where chrome', { encoding: 'utf8' }).trim().split('\n')[0];
      if (chromePath && existsSync(chromePath)) {
        return chromePath;
      }
    } catch {
      // Command failed, continue
    }
  }
  
  return undefined;
}

/**
 * Get launch options for puppeteer with proper browser configuration
 */
export function getBrowserLaunchOptions(additionalOptions: any = {}) {
  const executablePath = findChromePath();
  
  if (!executablePath) {
    throw new Error(
      'Chrome/Chromium browser not found. Please install Chrome or set CHROME_PATH environment variable.\n' +
      'Download Chrome from: https://www.google.com/chrome/\n' +
      'Or set environment variable: export CHROME_PATH="/path/to/chrome"'
    );
  }
  
  return {
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // For Windows compatibility
      '--disable-gpu'
    ],
    ...additionalOptions
  };
}