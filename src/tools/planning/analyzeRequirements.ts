// Planning tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

interface Requirement {
  id: string;
  title: string;
  description: string;
  type: 'functional' | 'non-functional' | 'business' | 'technical';
  priority: 'must-have' | 'should-have' | 'could-have' | 'wont-have';
  complexity: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  dependencies: string[];
  estimatedEffort: string;
  stakeholders: string[];
}

export const analyzeRequirementsDefinition: ToolDefinition = {
  name: 'analyze_requirements',
  description: '요구사항 분석|필요한 것들|requirements analysis|what we need|analyze requirements|필수 기능 - Analyze project requirements',
  inputSchema: {
    type: 'object',
    properties: {
      requirements: { type: 'string', description: 'List of requirements to analyze' },
      stakeholders: { type: 'string', description: 'Project stakeholders (e.g., users, admins, developers)' },
      constraints: { type: 'string', description: 'Project constraints (timeline, budget, technical)' },
      analysisMethod: { type: 'string', description: 'Analysis method', enum: ['moscow', 'kano', 'value-effort'], default: 'moscow' }
    },
    required: ['requirements']
  },
  annotations: {
    title: 'Analyze Requirements',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function analyzeRequirements(args: {
  requirements: string;
  stakeholders?: string;
  constraints?: string;
  analysisMethod?: string;
}): Promise<ToolResult> {
  const {
    requirements,
    stakeholders = 'end users, product owner, development team',
    constraints = 'standard timeline and budget constraints',
    analysisMethod = 'moscow'
  } = args;

  // Parse requirements
  const requirementList = requirements.split(/[,\n]/).map(r => r.trim()).filter(r => r.length > 0);
  const stakeholderList = stakeholders.split(',').map(s => s.trim());

  const analyzedRequirements: Requirement[] = requirementList.map((req, index) => {
    const reqId = `REQ-${String(index + 1).padStart(3, '0')}`;
    
    // Determine requirement type
    let type: 'functional' | 'non-functional' | 'business' | 'technical' = 'functional';
    if (req.toLowerCase().includes('performance') || req.toLowerCase().includes('security') || req.toLowerCase().includes('scalability')) {
      type = 'non-functional';
    } else if (req.toLowerCase().includes('business') || req.toLowerCase().includes('revenue') || req.toLowerCase().includes('cost')) {
      type = 'business';
    } else if (req.toLowerCase().includes('infrastructure') || req.toLowerCase().includes('architecture') || req.toLowerCase().includes('database')) {
      type = 'technical';
    }

    // Determine priority using MoSCoW
    let priority: 'must-have' | 'should-have' | 'could-have' | 'wont-have' = 'should-have';
    if (req.toLowerCase().includes('critical') || req.toLowerCase().includes('essential') || req.toLowerCase().includes('required')) {
      priority = 'must-have';
    } else if (req.toLowerCase().includes('important') || req.toLowerCase().includes('needed')) {
      priority = 'should-have';
    } else if (req.toLowerCase().includes('nice') || req.toLowerCase().includes('optional') || req.toLowerCase().includes('enhancement')) {
      priority = 'could-have';
    } else if (req.toLowerCase().includes('future') || req.toLowerCase().includes('later') || req.toLowerCase().includes('v2')) {
      priority = 'wont-have';
    }

    // Assess complexity
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    if (req.length > 100 || req.toLowerCase().includes('complex') || req.toLowerCase().includes('integration') || req.toLowerCase().includes('advanced')) {
      complexity = 'high';
    } else if (req.length < 50 || req.toLowerCase().includes('simple') || req.toLowerCase().includes('basic')) {
      complexity = 'low';
    }

    // Assess risk
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (req.toLowerCase().includes('external') || req.toLowerCase().includes('third-party') || req.toLowerCase().includes('new technology')) {
      risk = 'high';
    } else if (req.toLowerCase().includes('integration') || req.toLowerCase().includes('performance') || complexity === 'high') {
      risk = 'medium';
    }

    // Estimate effort
    let estimatedEffort = '3-5 days';
    if (complexity === 'high') {
      estimatedEffort = '1-3 weeks';
    } else if (complexity === 'low') {
      estimatedEffort = '1-2 days';
    }

    // Determine relevant stakeholders
    const relevantStakeholders = stakeholderList.filter(stakeholder => {
      if (type === 'business' && stakeholder.toLowerCase().includes('owner')) return true;
      if (type === 'technical' && stakeholder.toLowerCase().includes('developer')) return true;
      if (type === 'functional' && stakeholder.toLowerCase().includes('user')) return true;
      return true; // Include all by default
    });

    return {
      id: reqId,
      title: req.length > 50 ? req.substring(0, 47) + '...' : req,
      description: req,
      type,
      priority,
      complexity,
      risk,
      dependencies: [],
      estimatedEffort,
      stakeholders: relevantStakeholders
    };
  });

  const analysis = {
    action: 'analyze_requirements',
    method: analysisMethod,
    totalRequirements: analyzedRequirements.length,
    requirements: analyzedRequirements,
    priorityBreakdown: {
      mustHave: analyzedRequirements.filter(r => r.priority === 'must-have').length,
      shouldHave: analyzedRequirements.filter(r => r.priority === 'should-have').length,
      couldHave: analyzedRequirements.filter(r => r.priority === 'could-have').length,
      wontHave: analyzedRequirements.filter(r => r.priority === 'wont-have').length
    },
    typeBreakdown: {
      functional: analyzedRequirements.filter(r => r.type === 'functional').length,
      nonFunctional: analyzedRequirements.filter(r => r.type === 'non-functional').length,
      business: analyzedRequirements.filter(r => r.type === 'business').length,
      technical: analyzedRequirements.filter(r => r.type === 'technical').length
    },
    riskAssessment: {
      high: analyzedRequirements.filter(r => r.risk === 'high').length,
      medium: analyzedRequirements.filter(r => r.risk === 'medium').length,
      low: analyzedRequirements.filter(r => r.risk === 'low').length
    },
    recommendations: [
      'Focus on Must-Have requirements for MVP',
      'Validate high-risk requirements early',
      'Consider Should-Have items for post-MVP releases',
      'Review Could-Have items based on resource availability',
      'Plan technical requirements to support functional ones'
    ],
    constraints: constraints,
    status: 'success'
  };

  // Format output
  let formattedOutput = `# Requirements Analysis\n\n`;
  formattedOutput += `**Analysis Method:** ${analysisMethod.toUpperCase()}  \n`;
  formattedOutput += `**Total Requirements:** ${analysis.totalRequirements}  \n`;
  formattedOutput += `**Constraints:** ${constraints}\n\n`;

  formattedOutput += `## Priority Breakdown (MoSCoW)\n`;
  formattedOutput += `- **Must Have:** ${analysis.priorityBreakdown.mustHave}\n`;
  formattedOutput += `- **Should Have:** ${analysis.priorityBreakdown.shouldHave}\n`;
  formattedOutput += `- **Could Have:** ${analysis.priorityBreakdown.couldHave}\n`;
  formattedOutput += `- **Won't Have:** ${analysis.priorityBreakdown.wontHave}\n\n`;

  formattedOutput += `## Risk Assessment\n`;
  formattedOutput += `- **High Risk:** ${analysis.riskAssessment.high} requirements\n`;
  formattedOutput += `- **Medium Risk:** ${analysis.riskAssessment.medium} requirements\n`;
  formattedOutput += `- **Low Risk:** ${analysis.riskAssessment.low} requirements\n\n`;

  formattedOutput += `## Detailed Requirements\n\n`;

  // Group by priority
  const priorities = ['must-have', 'should-have', 'could-have', 'wont-have'] as const;
  priorities.forEach(priority => {
    const reqsForPriority = analyzedRequirements.filter(r => r.priority === priority);
    if (reqsForPriority.length > 0) {
      formattedOutput += `### ${priority.toUpperCase().replace('-', ' ')} (${reqsForPriority.length})\n\n`;
      reqsForPriority.forEach(req => {
        formattedOutput += `**${req.id}:** ${req.title}  \n`;
        formattedOutput += `*Type:* ${req.type} | *Complexity:* ${req.complexity} | *Risk:* ${req.risk} | *Effort:* ${req.estimatedEffort}  \n`;
        formattedOutput += `*Stakeholders:* ${req.stakeholders.join(', ')}\n\n`;
      });
    }
  });

  formattedOutput += `## Recommendations\n`;
  analysis.recommendations.forEach(rec => {
    formattedOutput += `- ${rec}\n`;
  });

  return {
    content: [{ type: 'text', text: formattedOutput }]
  };
}