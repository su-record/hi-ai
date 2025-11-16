// Browser development tool - completely independent

import puppeteer from 'puppeteer-core';
import { getBrowserLaunchOptions } from './browserUtils.js';
import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const inspectNetworkRequestsDefinition: ToolDefinition = {
  name: 'inspect_network_requests',
  description: '네트워크|API 호출|요청 확인|network|API calls|check requests|network traffic - Inspect network requests',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL to inspect' },
      filterType: { type: 'string', description: 'Request type filter', enum: ['all', 'xhr', 'fetch', 'websocket', 'failed'] },
      includeHeaders: { type: 'boolean', description: 'Include request/response headers' }
    },
    required: ['url']
  },
  annotations: {
    title: 'Inspect Network Requests',
    audience: ['user', 'assistant']
  }
};

export async function inspectNetworkRequests(args: { url: string; filterType?: string; includeHeaders?: boolean }): Promise<ToolResult> {
  const { url: inspectUrl, filterType = 'all', includeHeaders = false } = args;
  
  try {
    // Get browser launch options with proper executable path
    const launchOptions = getBrowserLaunchOptions();
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    const networkRequests: Array<{
      id: string;
      url: string;
      method: string;
      type: string;
      status?: number;
      statusText?: string;
      responseTime: number;
      size: number;
      timestamp: string;
      failed?: boolean;
      headers?: {
        request?: Record<string, string>;
        response?: Record<string, string>;
      };
    }> = [];
    
    let requestId = 0;
    const requestTimings = new Map<string, number>();
    
    // Capture network requests
    page.on('request', request => {
      const startTime = Date.now();
      const id = `req_${String(requestId++).padStart(3, '0')}`;
      const requestUrl = request.url();
      
      requestTimings.set(requestUrl, startTime);
      
      networkRequests.push({
        id,
        url: requestUrl,
        method: request.method(),
        type: request.resourceType(),
        responseTime: 0,
        size: 0,
        timestamp: new Date().toISOString(),
        headers: includeHeaders ? {
          request: request.headers()
        } : undefined
      });
    });
    
    page.on('response', async response => {
      const requestUrl = response.url();
      const request = networkRequests.find(req => req.url === requestUrl);
      const startTime = requestTimings.get(requestUrl);
      
      if (request) {
        request.status = response.status();
        request.statusText = response.statusText();
        request.responseTime = startTime ? Date.now() - startTime : 0;
        request.failed = !response.ok();
        
        if (includeHeaders && request.headers) {
          request.headers.response = response.headers();
        }
        
        // Estimate response size
        try {
          const buffer = await response.buffer();
          request.size = buffer.length;
        } catch {
          request.size = 0;
        }
      }
    });
    
    page.on('requestfailed', request => {
      const requestUrl = request.url();
      const failedRequest = networkRequests.find(req => req.url === requestUrl);
      if (failedRequest) {
        failedRequest.failed = true;
        failedRequest.status = 0;
        failedRequest.statusText = request.failure()?.errorText || 'Failed';
      }
    });
    
    // Navigate to URL and wait for network to be idle
    await page.goto(inspectUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait a bit for any remaining requests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await browser.close();
  
  const filteredRequests = networkRequests.filter(req => {
    switch (filterType) {
      case 'xhr':
        return req.type === 'xhr';
      case 'fetch':
        return req.type === 'fetch';
      case 'websocket':
        return req.type === 'websocket';
      case 'failed':
        return req.failed || (req.status !== undefined && req.status >= 400);
      default:
        return true;
    }
  });
  
  const networkInspectionResult = {
    action: 'inspect_network_requests',
    url: inspectUrl,
    filterType,
    includeHeaders,
    requests: filteredRequests,
    summary: {
      totalRequests: filteredRequests.length,
      successful: filteredRequests.filter(r => r.status !== undefined && r.status >= 200 && r.status < 300).length,
      failed: filteredRequests.filter(r => r.failed || (r.status !== undefined && r.status >= 400)).length,
      averageResponseTime: filteredRequests.reduce((sum, r) => sum + r.responseTime, 0) / filteredRequests.length,
      totalDataTransferred: filteredRequests.reduce((sum, r) => sum + r.size, 0),
      requestTypes: {
        xhr: filteredRequests.filter(r => r.type === 'xhr').length,
        fetch: filteredRequests.filter(r => r.type === 'fetch').length,
        websocket: filteredRequests.filter(r => r.type === 'websocket').length
      }
    },
    status: 'success'
  };
  
  // Compact summary format
  const failed = filteredRequests.filter(r => r.failed || (r.status !== undefined && r.status >= 400));
  const errorSummary = failed.length > 0
    ? `\nErrors: ${failed.slice(0, 3).map(r => `${r.method} ${new URL(r.url).pathname} (${r.status})`).join(', ')}${failed.length > 3 ? ` +${failed.length - 3}` : ''}`
    : '';

  return {
    content: [{
      type: 'text',
      text: `${networkInspectionResult.summary.totalRequests} reqs | ${networkInspectionResult.summary.successful} OK, ${networkInspectionResult.summary.failed} fail | Avg: ${networkInspectionResult.summary.averageResponseTime.toFixed(0)}ms | ${(networkInspectionResult.summary.totalDataTransferred / 1024).toFixed(1)}KB${errorSummary}`
    }]
  };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const helpMessage = errorMessage.includes('Chrome') ? 
      '\n\nTroubleshooting:\n1. Install Chrome: https://www.google.com/chrome/\n2. Or set CHROME_PATH environment variable\n3. Or install puppeteer instead of puppeteer-core' : '';
    return {
      content: [{ type: 'text', text: `Error inspecting network requests: ${errorMessage}${helpMessage}` }]
    };
  }
}