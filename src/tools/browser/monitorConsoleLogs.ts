// Browser development tool - completely independent

import puppeteer from 'puppeteer-core';

interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export const monitorConsoleLogsDefinition: ToolDefinition = {
  name: 'monitor_console_logs',
  description: 'Monitor browser console logs in real-time for debugging',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to monitor' },
      logLevel: { type: 'string', description: 'Log level to capture', enum: ['all', 'error', 'warn', 'info', 'debug'] },
      duration: { type: 'number', description: 'Monitoring duration in seconds' }
    },
    required: ['url']
  }
};

export async function monitorConsoleLogs(args: { url: string; logLevel?: string; duration?: number }): Promise<ToolResult> {
  const { url: monitorUrl, logLevel = 'all', duration = 30 } = args;
  
  try {
    const browser = await puppeteer.launch({ headless: true });
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
    
    return {
      content: [{ type: 'text', text: `Console Monitor Results:\n${JSON.stringify(consoleMonitorResult, null, 2)}` }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error monitoring console logs: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
}