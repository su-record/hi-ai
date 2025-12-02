// Time utility tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const getCurrentTimeDefinition: ToolDefinition = {
  name: 'get_current_time',
  description: '지금 몇시|현재 시간|몇시야|what time|current time|time now - Get current time',
  inputSchema: {
    type: 'object',
    properties: {
      format: { type: 'string', description: 'Time format', enum: ['iso', 'local', 'utc', 'timestamp', 'human'] },
      timezone: { type: 'string', description: 'Timezone (e.g., America/New_York, Asia/Seoul)' }
    },
    required: []
  },
  annotations: {
    title: 'Get Current Time',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  }
};

export async function getCurrentTime(args: { format?: string; timezone?: string }): Promise<ToolResult> {
  const { format = 'iso', timezone } = args;
  const now = new Date();
  
  let timeResult: string;
  
  switch (format) {
    case 'iso':
      timeResult = now.toISOString();
      break;
    case 'local':
      timeResult = now.toLocaleString();
      break;
    case 'utc':
      timeResult = now.toUTCString();
      break;
    case 'timestamp':
      timeResult = Math.floor(now.getTime() / 1000).toString();
      break;
    case 'human':
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: timezone
      };
      timeResult = now.toLocaleString('en-US', options);
      break;
    default:
      timeResult = now.toISOString();
  }
  
  const currentTimeResult = {
    action: 'get_current_time',
    format,
    timezone: timezone || 'local',
    result: timeResult,
    timestamp: now.getTime(),
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Time: ${timeResult}\nFormat: ${format}\nTimezone: ${timezone || 'local'}\nTimestamp: ${now.getTime()}` }]
  };
}