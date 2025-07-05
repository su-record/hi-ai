// Sequential thinking tool - completely independent

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

export const formatAsPlanDefinition: ToolDefinition = {
  name: 'format_as_plan',
  description: 'Format unstructured text or responses into clear, step-by-step plans',
  inputSchema: {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'Content to format as a plan' },
      priority: { type: 'string', description: 'Default priority level', enum: ['high', 'medium', 'low'] },
      includeTimeEstimates: { type: 'boolean', description: 'Include time estimates for each step' },
      includeCheckboxes: { type: 'boolean', description: 'Include checkboxes for tracking progress' }
    },
    required: ['content']
  }
};

export async function formatAsPlan(args: { content: string; priority?: string; includeTimeEstimates?: boolean; includeCheckboxes?: boolean }): Promise<ToolResult> {
  const { content: planContent, priority = 'medium', includeTimeEstimates = true, includeCheckboxes = true } = args;
  
  // Parse content into actionable steps
  const sentences = planContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const planSteps = sentences.map((sentence, index) => {
    const stepNumber = index + 1;
    const cleanSentence = sentence.trim();
    
    // Estimate time based on content complexity
    let timeEstimate = '5min';
    if (cleanSentence.length > 100) timeEstimate = '15min';
    else if (cleanSentence.length > 50) timeEstimate = '10min';
    
    // Detect priority keywords
    let stepPriority = priority;
    if (cleanSentence.match(/urgent|critical|important|first|must/i)) stepPriority = 'high';
    else if (cleanSentence.match(/later|eventually|nice|optional/i)) stepPriority = 'low';
    
    // Format step
    let formattedStep = includeCheckboxes ? `${stepNumber}. □ ` : `${stepNumber}. `;
    formattedStep += cleanSentence;
    if (includeTimeEstimates) formattedStep += ` (${stepPriority.toUpperCase()}, ${timeEstimate})`;
    
    return {
      number: stepNumber,
      content: cleanSentence,
      priority: stepPriority,
      timeEstimate,
      formatted: formattedStep
    };
  });
  
  // Calculate total time
  const totalMinutes = planSteps.reduce((total: number, step: any) => {
    const minutes = parseInt(step.timeEstimate.replace('min', ''));
    return total + minutes;
  }, 0);
  
  const planResult = {
    action: 'format_as_plan',
    originalContent: planContent,
    formattedPlan: planSteps.map((s: any) => s.formatted).join('\n'),
    steps: planSteps.length,
    totalEstimatedTime: `${totalMinutes} minutes`,
    breakdown: {
      high: planSteps.filter((s: any) => s.priority === 'high').length,
      medium: planSteps.filter((s: any) => s.priority === 'medium').length,
      low: planSteps.filter((s: any) => s.priority === 'low').length
    },
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Formatted Plan:\n\n${planResult.formattedPlan}\n\nTotal estimated time: ${planResult.totalEstimatedTime}\nSteps breakdown: ${planResult.breakdown.high} high, ${planResult.breakdown.medium} medium, ${planResult.breakdown.low} low priority` }]
  };
}