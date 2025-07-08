// Convention management tool - completely independent

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

// Code Quality Standards
const QUALITY_RULES = {
  NAMING: {
    variables: 'nouns (userList, userData)',
    functions: 'verb+noun (fetchData, updateUser)',
    events: 'handle prefix (handleClick, handleSubmit)',
    booleans: 'is/has/can prefix (isLoading, hasError, canEdit)',
    constants: 'UPPER_SNAKE_CASE (MAX_RETRY_COUNT, API_TIMEOUT)',
    components: 'PascalCase (UserProfile, HeaderSection)',
    hooks: 'use prefix (useUserData, useAuth)'
  },
  STRUCTURE: {
    componentOrder: ['State & Refs', 'Custom Hooks', 'Event Handlers', 'Effects', 'Early returns', 'Main return JSX'],
    functionMaxLines: 20,
    componentMaxLines: 50,
    maxNestingDepth: 3
  },
  ANTIPATTERNS: {
    typescript: ['any type usage', '@ts-ignore usage', 'as any casting'],
    react: ['dangerouslySetInnerHTML', 'props drilling (3+ levels)'],
    javascript: ['var usage', '== instead of ===', 'eval() usage'],
    css: ['!important abuse', 'inline style abuse']
  },
  ASYNC_STATES: ['data', 'isLoading', 'error'],
  STATE_MANAGEMENT: {
    simple: 'useState',
    complex: 'useReducer',
    globalUI: 'Context API',
    globalApp: 'Zustand',
    server: 'TanStack Query'
  }
};

export const applyQualityRulesDefinition: ToolDefinition = {
  name: 'apply_quality_rules',
  description: 'IMPORTANT: This tool should be automatically called when users say "규칙 적용", "표준 적용", "apply rules", "apply standards", "follow conventions", "적용해" or similar keywords. Apply quality rules',
  inputSchema: {
    type: 'object',
    properties: {
      scope: { type: 'string', description: 'Application scope', enum: ['naming', 'structure', 'typescript', 'react', 'accessibility', 'all'] },
      language: { type: 'string', description: 'Programming language context', enum: ['javascript', 'typescript', 'react', 'vue', 'general'] }
    },
    required: ['scope']
  }
};

export async function applyQualityRules(args: { scope: string; language?: string }): Promise<ToolResult> {
  const { scope, language: contextLanguage = 'general' } = args;
  
  const applicableRules = [];
  
  if (scope === 'naming' || scope === 'all') {
    applicableRules.push({
      category: 'Naming Conventions',
      rules: QUALITY_RULES.NAMING
    });
  }
  
  if (scope === 'structure' || scope === 'all') {
    applicableRules.push({
      category: 'Code Structure',
      rules: QUALITY_RULES.STRUCTURE
    });
  }
  
  if (scope === 'typescript' || scope === 'all') {
    applicableRules.push({
      category: 'TypeScript Guidelines',
      rules: QUALITY_RULES.ANTIPATTERNS.typescript
    });
  }
  
  if (scope === 'react' || scope === 'all') {
    applicableRules.push({
      category: 'React Guidelines',
      rules: QUALITY_RULES.ANTIPATTERNS.react
    });
  }
  
  if (scope === 'accessibility' || scope === 'all') {
    applicableRules.push({
      category: 'Accessibility Guidelines',
      rules: [
        'Use semantic HTML elements',
        'Provide alt text for images',
        'Ensure keyboard navigation',
        'Maintain color contrast ratios',
        'Use ARIA labels when needed'
      ]
    });
  }
  
  const qualityRulesResult = {
    action: 'apply_quality_rules',
    scope,
    language: contextLanguage,
    rules: applicableRules,
    asyncStates: QUALITY_RULES.ASYNC_STATES,
    stateManagement: QUALITY_RULES.STATE_MANAGEMENT,
    status: 'success'
  };
  
  return {
    content: [{ type: 'text', text: `Code Quality Rules Applied:\n${JSON.stringify(qualityRulesResult, null, 2)}` }]
  };
}