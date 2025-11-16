// Browser development tool - completely independent

import puppeteer from 'puppeteer-core';
import { getBrowserLaunchOptions } from './browserUtils.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const monitorConsoleLogsDefinition: ToolDefinition = {
  name: 'monitor_console_logs',
  description: '콘솔 로그|에러 확인|로그 봐줘|console|check logs|debug output|console errors - Monitor browser console',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to monitor' },
      logLevel: { type: 'string', description: 'Log level to capture', enum: ['all', 'error', 'warn', 'info', 'debug'] },
      duration: { type: 'number', description: 'Monitoring duration in seconds' }
    },
    required: ['url']
  },
  annotations: {
    title: 'Monitor Console Logs',
    audience: ['user', 'assistant']
  }
};

export async function monitorConsoleLogs(args: { url: string; logLevel?: string; duration?: number }): Promise<ToolResult> {
  const { url: monitorUrl, logLevel = 'all', duration = 30 } = args;
  
  try {
    // Get browser launch options with proper executable path
    const launchOptions = getBrowserLaunchOptions();
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    const logs: Array<{timestamp: string, level: string, message: string, source?: string}> = [];
    
    // Capture console events
    page.on('console', msg => {
      const msgLevel = msg.type();
      if (logLevel === 'all' || msgLevel === logLevel) {
        logs.push({
          timestamp: new Date().toISOString(),
          level: msgLevel,
          message: msg.text(),
          source: msg.location()?.url || 'unknown'
        });
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      if (logLevel === 'all' || logLevel === 'error') {
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: error.message,
          source: error.stack?.split('\n')[0] || 'unknown'
        });
      }
    });
    
    // Navigate to URL and wait for specified duration
    await page.goto(monitorUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    
    await browser.close();
    
    const consoleMonitorResult = {
      action: 'monitor_console_logs',
      url: monitorUrl,
      logLevel,
      duration,
      capturedLogs: logs,
      summary: {
        totalLogs: logs.length,
        errors: logs.filter(l => l.level === 'error').length,
        warnings: logs.filter(l => l.level === 'warn').length,
        infos: logs.filter(l => l.level === 'info').length,
        debugs: logs.filter(l => l.level === 'debug').length,
        logs: logs.filter(l => l.level === 'log').length
      },
      monitoringStatus: 'completed',
      status: 'success'
    };
    
    // Compact summary with errors only
    const errors = logs.filter(l => l.level === 'error');
    const warnings = logs.filter(l => l.level === 'warn');
    const errorSummary = errors.length > 0
      ? `\nErrors: ${errors.slice(0, 3).map(l => l.message.substring(0, 50)).join(', ')}${errors.length > 3 ? ` +${errors.length - 3}` : ''}`
      : '';
    const warnSummary = warnings.length > 0 && errors.length === 0
      ? `\nWarnings: ${warnings.slice(0, 3).map(l => l.message.substring(0, 50)).join(', ')}${warnings.length > 3 ? ` +${warnings.length - 3}` : ''}`
      : '';

    return {
      content: [{
        type: 'text',
        text: `${logs.length} logs | ${consoleMonitorResult.summary.errors}E ${consoleMonitorResult.summary.warnings}W ${consoleMonitorResult.summary.infos}I | ${duration}s${errorSummary}${warnSummary}`
      }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const helpMessage = errorMessage.includes('Chrome') ? 
      '\n\nTroubleshooting:\n1. Install Chrome: https://www.google.com/chrome/\n2. Or set CHROME_PATH environment variable\n3. Or install puppeteer instead of puppeteer-core' : '';
    return {
      content: [{ type: 'text', text: `Error monitoring console logs: ${errorMessage}${helpMessage}` }]
    };
  }
}