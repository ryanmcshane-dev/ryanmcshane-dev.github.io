export interface SkillGroup {
  id: string;
  title: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    title: 'Languages',
    skills: ['Java', 'TypeScript', 'JavaScript', 'SQL'],
  },
  {
    id: 'backend',
    title: 'Backend & Architecture',
    skills: [
      'Spring Boot',
      'Apache Camel',
      'IBM MQ',
      'Event-driven architecture',
      'REST APIs',
      'OAuth 2.0',
      'PostgreSQL',
      'Hibernate / JPA',
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud & DevOps',
    skills: ['AWS', 'ECS', 'GitLab CI/CD', 'Docker'],
  },
  {
    id: 'ai',
    title: 'AI & Agentic',
    skills: [
      'Claude Code',
      'Spec-driven development',
      'Skills & hooks',
      'Subagents',
      'MCP / tool integrations',
      'RAG',
      'Knowledge graphs',
    ],
  },
  {
    id: 'observability',
    title: 'Observability',
    skills: ['Splunk', 'New Relic', 'Spring Boot Admin', 'Alerting & health monitoring'],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    skills: ['React', 'TypeScript', 'Vite'],
  },
  {
    id: 'testing',
    title: 'Testing',
    skills: ['Quality engineering', 'Unit & integration testing', 'Test automation'],
  },
];
