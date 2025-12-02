// Planning tool - completely independent

import { ToolResult, ToolDefinition } from '../../types/tool.js';

interface UserStory {
  id: string;
  title: string;
  story: string;
  userType: string;
  functionality: string;
  benefit: string;
  acceptanceCriteria: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedEffort: string;
  dependencies: string[];
}

export const createUserStoriesDefinition: ToolDefinition = {
  name: 'create_user_stories',
  description: '스토리|사용자 스토리|user story|user stories|as a user - Generate user stories from requirements',
  inputSchema: {
    type: 'object',
    properties: {
      features: { type: 'string', description: 'List of features or requirements to convert to user stories' },
      userTypes: { type: 'string', description: 'Types of users (e.g., admin, customer, guest)' },
      priority: { type: 'string', description: 'Default priority level', enum: ['high', 'medium', 'low'] },
      includeAcceptanceCriteria: { type: 'boolean', description: 'Include acceptance criteria for each story' }
    },
    required: ['features']
  },
  annotations: {
    title: 'Create User Stories',
    audience: ['user', 'assistant'],
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

export async function createUserStories(args: {
  features: string;
  userTypes?: string;
  priority?: string;
  includeAcceptanceCriteria?: boolean;
}): Promise<ToolResult> {
  const {
    features,
    userTypes = 'user, admin, guest',
    priority = 'medium',
    includeAcceptanceCriteria = true
  } = args;

  // Parse features into individual items
  const featureList = features.split(/[,\n]/).map(f => f.trim()).filter(f => f.length > 0);
  const userTypeList = userTypes.split(',').map(u => u.trim());

  const userStories: UserStory[] = featureList.map((feature, index) => {
    const storyId = `US-${String(index + 1).padStart(3, '0')}`;
    
    // Determine user type based on feature content
    let selectedUserType = userTypeList[0];
    if (feature.toLowerCase().includes('admin') || feature.toLowerCase().includes('manage')) {
      selectedUserType = userTypeList.find(u => u.toLowerCase().includes('admin')) || selectedUserType;
    } else if (feature.toLowerCase().includes('guest') || feature.toLowerCase().includes('browse')) {
      selectedUserType = userTypeList.find(u => u.toLowerCase().includes('guest')) || selectedUserType;
    }

    // Extract functionality and benefit
    const functionality = feature;
    let benefit = 'to achieve my goals efficiently';
    
    // Try to infer benefit from common patterns
    if (feature.toLowerCase().includes('search')) benefit = 'to find relevant information quickly';
    else if (feature.toLowerCase().includes('save') || feature.toLowerCase().includes('store')) benefit = 'to preserve my data for future use';
    else if (feature.toLowerCase().includes('share')) benefit = 'to collaborate with others effectively';
    else if (feature.toLowerCase().includes('track') || feature.toLowerCase().includes('monitor')) benefit = 'to stay informed about important changes';
    else if (feature.toLowerCase().includes('customize') || feature.toLowerCase().includes('configure')) benefit = 'to tailor the experience to my needs';

    // Generate acceptance criteria
    const acceptanceCriteria = includeAcceptanceCriteria ? [
      `Given I am a ${selectedUserType}, when I access the ${functionality.toLowerCase()} feature, then it should be available and functional`,
      `When I use the ${functionality.toLowerCase()} feature, then it should provide clear feedback about the action`,
      `The ${functionality.toLowerCase()} feature should handle errors gracefully and provide helpful messages`,
      `The feature should be accessible and usable across different devices and browsers`
    ] : [];

    // Determine priority based on feature content
    let storyPriority: 'high' | 'medium' | 'low' = priority as any;
    if (feature.toLowerCase().includes('critical') || feature.toLowerCase().includes('security') || feature.toLowerCase().includes('login')) {
      storyPriority = 'high';
    } else if (feature.toLowerCase().includes('nice to have') || feature.toLowerCase().includes('optional')) {
      storyPriority = 'low';
    }

    // Estimate effort based on complexity
    let estimatedEffort = '3-5 days';
    if (feature.length > 100 || feature.toLowerCase().includes('complex') || feature.toLowerCase().includes('integration')) {
      estimatedEffort = '1-2 weeks';
    } else if (feature.length < 30 || feature.toLowerCase().includes('simple') || feature.toLowerCase().includes('basic')) {
      estimatedEffort = '1-2 days';
    }

    return {
      id: storyId,
      title: `${selectedUserType} - ${functionality}`,
      story: `As a ${selectedUserType}, I want to ${functionality.toLowerCase()}, so that ${benefit}.`,
      userType: selectedUserType,
      functionality,
      benefit,
      acceptanceCriteria,
      priority: storyPriority,
      estimatedEffort,
      dependencies: []
    };
  });

  const result = {
    action: 'create_user_stories',
    totalStories: userStories.length,
    userTypes: userTypeList,
    stories: userStories,
    summary: {
      high: userStories.filter(s => s.priority === 'high').length,
      medium: userStories.filter(s => s.priority === 'medium').length,
      low: userStories.filter(s => s.priority === 'low').length,
      estimatedTotalEffort: `${userStories.length * 3}-${userStories.length * 7} days`
    },
    status: 'success'
  };

  // Format output
  let formattedOutput = `# User Stories\n\n**Total Stories:** ${result.totalStories}  \n**Priority Breakdown:** ${result.summary.high} High, ${result.summary.medium} Medium, ${result.summary.low} Low  \n**Estimated Effort:** ${result.summary.estimatedTotalEffort}\n\n`;

  userStories.forEach((story, index) => {
    formattedOutput += `## ${story.id}: ${story.title}\n\n`;
    formattedOutput += `**Story:** ${story.story}\n\n`;
    formattedOutput += `**Priority:** ${story.priority.toUpperCase()}  \n`;
    formattedOutput += `**Estimated Effort:** ${story.estimatedEffort}\n\n`;
    
    if (story.acceptanceCriteria.length > 0) {
      formattedOutput += `**Acceptance Criteria:**\n`;
      story.acceptanceCriteria.forEach((criteria, i) => {
        formattedOutput += `${i + 1}. ${criteria}\n`;
      });
      formattedOutput += '\n';
    }
    
    if (index < userStories.length - 1) {
      formattedOutput += '---\n\n';
    }
  });

  return {
    content: [{ type: 'text', text: formattedOutput }]
  };
}