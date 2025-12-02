// Planning tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  phase: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
  dependencies: string[];
  deliverables: string[];
  successCriteria: string[];
  risks: string[];
}

interface RoadmapPhase {
  name: string;
  duration: string;
  goals: string[];
  features: RoadmapItem[];
  milestones: string[];
}

export const featureRoadmapDefinition: ToolDefinition = {
  name: 'feature_roadmap',
  description: '로드맵|일정|계획표|roadmap|timeline|project plan|development schedule - Generate development roadmap',
  inputSchema: {
    type: 'object',
    properties: {
      projectName: { type: 'string', description: 'Name of the project' },
      features: { type: 'string', description: 'List of features to include in roadmap' },
      timeframe: { type: 'string', description: 'Project timeframe', enum: ['3-months', '6-months', '12-months', 'custom'] },
      approach: { type: 'string', description: 'Development approach', enum: ['mvp-first', 'phased-rollout', 'big-bang'], default: 'mvp-first' },
      teamSize: { type: 'number', description: 'Development team size' }
    },
    required: ['projectName', 'features']
  },
  annotations: {
    title: 'Feature Roadmap',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function featureRoadmap(args: {
  projectName: string;
  features: string;
  timeframe?: string;
  approach?: string;
  teamSize?: number;
}): Promise<ToolResult> {
  const {
    projectName,
    features,
    timeframe = '6-months',
    approach = 'mvp-first',
    teamSize = 3
  } = args;

  // Parse features
  const featureList = features.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);

  // Define phases based on approach
  let phaseNames: string[] = [];
  if (approach === 'mvp-first') {
    phaseNames = ['MVP Foundation', 'Core Features', 'Advanced Features', 'Optimization & Scaling'];
  } else if (approach === 'phased-rollout') {
    phaseNames = ['Phase 1: Core', 'Phase 2: Enhancement', 'Phase 3: Expansion', 'Phase 4: Innovation'];
  } else {
    phaseNames = ['Planning & Setup', 'Development Sprint', 'Integration & Testing', 'Launch & Monitoring'];
  }

  // Calculate phase durations
  const totalMonths = timeframe === '3-months' ? 3 : timeframe === '6-months' ? 6 : timeframe === '12-months' ? 12 : 6;
  const monthsPerPhase = Math.ceil(totalMonths / phaseNames.length);

  // Categorize features by priority and complexity
  const roadmapItems: RoadmapItem[] = featureList.map((feature, index) => {
    const itemId = `F-${String(index + 1).padStart(3, '0')}`;
    
    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (feature.toLowerCase().includes('critical') || feature.toLowerCase().includes('core') || feature.toLowerCase().includes('essential')) {
      priority = 'high';
    } else if (feature.toLowerCase().includes('enhancement') || feature.toLowerCase().includes('nice') || feature.toLowerCase().includes('optional')) {
      priority = 'low';
    }

    // Determine phase based on priority and approach
    let phase = phaseNames[1]; // Default to second phase
    if (priority === 'high' || feature.toLowerCase().includes('mvp') || feature.toLowerCase().includes('basic')) {
      phase = phaseNames[0];
    } else if (priority === 'low' || feature.toLowerCase().includes('advanced') || feature.toLowerCase().includes('future')) {
      phase = phaseNames[Math.min(2, phaseNames.length - 1)];
    }

    // Estimate duration
    let estimatedDuration = '2-3 weeks';
    if (feature.length > 100 || feature.toLowerCase().includes('complex') || feature.toLowerCase().includes('integration')) {
      estimatedDuration = '4-6 weeks';
    } else if (feature.length < 50 || feature.toLowerCase().includes('simple')) {
      estimatedDuration = '1-2 weeks';
    }

    // Generate deliverables
    const deliverables = [
      `${feature} implementation`,
      `Unit and integration tests`,
      `Documentation and user guides`,
      `Code review and quality assurance`
    ];

    // Generate success criteria
    const successCriteria = [
      `Feature functions as specified`,
      `Meets performance requirements`,
      `Passes all test cases`,
      `User acceptance criteria met`
    ];

    // Identify potential risks
    const risks = [];
    if (feature.toLowerCase().includes('external') || feature.toLowerCase().includes('third-party')) {
      risks.push('External dependency risk');
    }
    if (feature.toLowerCase().includes('performance') || feature.toLowerCase().includes('scalability')) {
      risks.push('Performance optimization complexity');
    }
    if (feature.toLowerCase().includes('security') || feature.toLowerCase().includes('authentication')) {
      risks.push('Security implementation complexity');
    }
    if (risks.length === 0) {
      risks.push('Standard development risks');
    }

    return {
      id: itemId,
      title: feature.length > 50 ? feature.substring(0, 47) + '...' : feature,
      description: feature,
      phase,
      priority,
      estimatedDuration,
      dependencies: [],
      deliverables,
      successCriteria,
      risks
    };
  });

  // Group features by phase
  const phases: RoadmapPhase[] = phaseNames.map((phaseName, index) => {
    const phaseFeatures = roadmapItems.filter(item => item.phase === phaseName);
    const phaseGoals = [];
    
    if (index === 0) {
      phaseGoals.push('Establish core functionality', 'Validate core assumptions', 'Build foundation for future features');
    } else if (index === 1) {
      phaseGoals.push('Enhance user experience', 'Add key differentiating features', 'Improve system reliability');
    } else if (index === 2) {
      phaseGoals.push('Scale system capabilities', 'Add advanced features', 'Optimize performance');
    } else {
      phaseGoals.push('Continuous improvement', 'Innovation and experimentation', 'Long-term sustainability');
    }

    const milestones = [
      `${phaseName} features delivered`,
      `Quality assurance completed`,
      `User feedback incorporated`,
      `Metrics and KPIs reviewed`
    ];

    return {
      name: phaseName,
      duration: `${monthsPerPhase} month${monthsPerPhase > 1 ? 's' : ''}`,
      goals: phaseGoals,
      features: phaseFeatures,
      milestones
    };
  });

  const roadmap = {
    action: 'feature_roadmap',
    project: projectName,
    timeframe,
    approach,
    teamSize,
    phases,
    summary: {
      totalFeatures: roadmapItems.length,
      totalDuration: `${totalMonths} months`,
      highPriorityFeatures: roadmapItems.filter(f => f.priority === 'high').length,
      mediumPriorityFeatures: roadmapItems.filter(f => f.priority === 'medium').length,
      lowPriorityFeatures: roadmapItems.filter(f => f.priority === 'low').length
    },
    recommendations: [
      'Review and validate priorities with stakeholders',
      'Set up regular milestone reviews and adjustments',
      'Plan for buffer time between phases for testing',
      'Consider team capacity and external dependencies',
      'Establish clear success metrics for each phase'
    ],
    status: 'success'
  };

  // Format output
  let formattedOutput = `# ${projectName} - Feature Roadmap\n\n`;
  formattedOutput += `**Timeframe:** ${timeframe}  \n`;
  formattedOutput += `**Approach:** ${approach}  \n`;
  formattedOutput += `**Team Size:** ${teamSize} developers  \n`;
  formattedOutput += `**Total Features:** ${roadmap.summary.totalFeatures}\n\n`;

  formattedOutput += `## Overview\n`;
  formattedOutput += `- **High Priority:** ${roadmap.summary.highPriorityFeatures} features\n`;
  formattedOutput += `- **Medium Priority:** ${roadmap.summary.mediumPriorityFeatures} features\n`;
  formattedOutput += `- **Low Priority:** ${roadmap.summary.lowPriorityFeatures} features\n\n`;

  phases.forEach((phase, index) => {
    formattedOutput += `## ${phase.name}\n`;
    formattedOutput += `**Duration:** ${phase.duration}  \n`;
    formattedOutput += `**Features:** ${phase.features.length}\n\n`;

    formattedOutput += `### Goals\n`;
    phase.goals.forEach(goal => {
      formattedOutput += `- ${goal}\n`;
    });
    formattedOutput += '\n';

    if (phase.features.length > 0) {
      formattedOutput += `### Features\n`;
      phase.features.forEach(feature => {
        formattedOutput += `**${feature.id}:** ${feature.title} (${feature.priority.toUpperCase()})  \n`;
        formattedOutput += `*Duration:* ${feature.estimatedDuration}  \n`;
        formattedOutput += `*Key Risks:* ${feature.risks.join(', ')}\n\n`;
      });
    }

    formattedOutput += `### Milestones\n`;
    phase.milestones.forEach(milestone => {
      formattedOutput += `- ${milestone}\n`;
    });

    if (index < phases.length - 1) {
      formattedOutput += '\n---\n\n';
    }
  });

  formattedOutput += `\n## Recommendations\n`;
  roadmap.recommendations.forEach(rec => {
    formattedOutput += `- ${rec}\n`;
  });

  return {
    content: [{ type: 'text', text: formattedOutput }]
  };
}