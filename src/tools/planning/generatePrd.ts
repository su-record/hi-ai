// Planning tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

export const generatePrdDefinition: ToolDefinition = {
  name: 'generate_prd',
  description: 'PRD|요구사항 문서|제품 요구사항|product requirements|requirements document|spec document - Generate Product Requirements Document',
  inputSchema: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: 'Name of the product/feature' },
      productVision: { type: 'string', description: 'High-level vision and goals' },
      targetAudience: { type: 'string', description: 'Target users and stakeholders' },
      businessObjectives: { type: 'string', description: 'Business goals and success metrics' },
      functionalRequirements: { type: 'string', description: 'Key features and functionality' },
      constraints: { type: 'string', description: 'Technical/business constraints' }
    },
    required: ['productName', 'productVision']
  },
  annotations: {
    title: 'Generate PRD',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function generatePrd(args: {
  productName: string;
  productVision: string;
  targetAudience?: string;
  businessObjectives?: string;
  functionalRequirements?: string;
  constraints?: string;
}): Promise<ToolResult> {
  const {
    productName,
    productVision,
    targetAudience = 'General users',
    businessObjectives = 'Improve user experience and business value',
    functionalRequirements = 'Core functionality to be defined',
    constraints = 'Standard technical and budget constraints'
  } = args;

  const prd = {
    action: 'generate_prd',
    product: productName,
    document: {
      title: `Product Requirements Document: ${productName}`,
      version: '1.0',
      date: new Date().toISOString().split('T')[0],
      sections: {
        executiveSummary: {
          title: 'Executive Summary',
          content: `${productName} is designed to ${productVision}. This document outlines the requirements, scope, and implementation strategy for delivering value to ${targetAudience}.`
        },
        productOverview: {
          title: 'Product Overview',
          vision: productVision,
          objectives: businessObjectives,
          targetUsers: targetAudience,
          successMetrics: [
            'User adoption rate',
            'Feature usage metrics',
            'User satisfaction score',
            'Business impact measurement'
          ]
        },
        functionalRequirements: {
          title: 'Functional Requirements',
          description: functionalRequirements,
          coreFeatures: [
            'User authentication and management',
            'Core functionality implementation',
            'Data processing and storage',
            'User interface and experience',
            'Integration capabilities'
          ],
          userFlows: [
            'User onboarding process',
            'Main feature usage flow',
            'Error handling and recovery',
            'Administrative functions'
          ]
        },
        nonFunctionalRequirements: {
          title: 'Non-Functional Requirements',
          performance: 'Fast response times (<2s), high availability (99.9%)',
          security: 'Data encryption, secure authentication, privacy compliance',
          scalability: 'Support growing user base and data volume',
          usability: 'Intuitive interface, accessibility standards',
          compatibility: 'Cross-platform support, browser compatibility'
        },
        constraints: {
          title: 'Constraints and Assumptions',
          technical: constraints,
          timeline: 'Development timeline to be defined based on scope',
          budget: 'Budget allocation for development and infrastructure',
          resources: 'Team capacity and skill requirements'
        },
        implementationPlan: {
          title: 'Implementation Strategy',
          phases: [
            'Phase 1: Core functionality development',
            'Phase 2: Advanced features and integrations',
            'Phase 3: Performance optimization and scaling',
            'Phase 4: Launch and post-launch improvements'
          ],
          riskMitigation: [
            'Technical risk assessment and mitigation',
            'Resource and timeline risk management',
            'Market and user acceptance risks',
            'Compliance and security considerations'
          ]
        }
      }
    },
    recommendations: [
      'Conduct user research to validate assumptions',
      'Create detailed wireframes and prototypes',
      'Define detailed acceptance criteria for each feature',
      'Set up monitoring and analytics for success metrics',
      'Plan for iterative development and feedback loops'
    ],
    status: 'success'
  };

  const formattedPrd = `# ${prd.document.title}

**Version:** ${prd.document.version}  
**Date:** ${prd.document.date}

## ${prd.document.sections.executiveSummary.title}
${prd.document.sections.executiveSummary.content}

## ${prd.document.sections.productOverview.title}
**Vision:** ${prd.document.sections.productOverview.vision}
**Objectives:** ${prd.document.sections.productOverview.objectives}
**Target Users:** ${prd.document.sections.productOverview.targetUsers}

**Success Metrics:**
${prd.document.sections.productOverview.successMetrics.map(metric => `- ${metric}`).join('\n')}

## ${prd.document.sections.functionalRequirements.title}
${prd.document.sections.functionalRequirements.description}

**Core Features:**
${prd.document.sections.functionalRequirements.coreFeatures.map(feature => `- ${feature}`).join('\n')}

**User Flows:**
${prd.document.sections.functionalRequirements.userFlows.map(flow => `- ${flow}`).join('\n')}

## ${prd.document.sections.nonFunctionalRequirements.title}
- **Performance:** ${prd.document.sections.nonFunctionalRequirements.performance}
- **Security:** ${prd.document.sections.nonFunctionalRequirements.security}
- **Scalability:** ${prd.document.sections.nonFunctionalRequirements.scalability}
- **Usability:** ${prd.document.sections.nonFunctionalRequirements.usability}
- **Compatibility:** ${prd.document.sections.nonFunctionalRequirements.compatibility}

## ${prd.document.sections.constraints.title}
- **Technical:** ${prd.document.sections.constraints.technical}
- **Timeline:** ${prd.document.sections.constraints.timeline}
- **Budget:** ${prd.document.sections.constraints.budget}
- **Resources:** ${prd.document.sections.constraints.resources}

## ${prd.document.sections.implementationPlan.title}
**Development Phases:**
${prd.document.sections.implementationPlan.phases.map(phase => `- ${phase}`).join('\n')}

**Risk Mitigation:**
${prd.document.sections.implementationPlan.riskMitigation.map(risk => `- ${risk}`).join('\n')}

## Recommendations
${prd.recommendations.map(rec => `- ${rec}`).join('\n')}`;

  return {
    content: [{ type: 'text', text: formattedPrd }]
  };
}