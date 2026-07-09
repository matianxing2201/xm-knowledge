export interface KnowledgeSubject {
  label: string
  href?: string
  children?: KnowledgeSubject[]
}

export interface KnowledgeDomain {
  name: string
  icon: string
  accent: string
  subjects: KnowledgeSubject[]
}

export const knowledgeTree: KnowledgeDomain[] = [
  {
    name: 'AI',
    icon: 'ri:robot-line',
    accent: 'var(--color-ai)',
    subjects: [
      { label: 'Prompt' },
      { label: 'RAG' },
      {
        label: 'Agent',
        children: [
          { label: 'Memory', href: '/xm-knowledge/ai/' },
          { label: 'Planning', href: '/xm-knowledge/ai/' },
          { label: 'Tool Calling', href: '/xm-knowledge/ai/' },
        ],
      },
      { label: 'MCP' },
    ],
  },
  {
    name: 'Java',
    icon: 'mdi:coffee',
    accent: 'var(--color-java)',
    subjects: [
      { label: 'Spring', href: '/xm-knowledge/java/' },
      { label: 'JVM', href: '/xm-knowledge/java/' },
      { label: '并发', href: '/xm-knowledge/java/' },
    ],
  },
  {
    name: 'Go',
    icon: 'mdi:language-go',
    accent: 'var(--color-go)',
    subjects: [
      { label: 'Goroutine', href: '/xm-knowledge/go/' },
      { label: 'Channel', href: '/xm-knowledge/go/' },
      { label: 'Web', href: '/xm-knowledge/go/' },
    ],
  },
  {
    name: 'Web',
    icon: 'mdi:web',
    accent: 'var(--color-web)',
    subjects: [
      { label: 'Vue', href: '/xm-knowledge/web/vue/' },
      { label: 'React', href: '/xm-knowledge/web/react/' },
      { label: 'TypeScript', href: '/xm-knowledge/web/typescript/' },
    ],
  },
]

export interface CurrentTopic {
  name: string
  desc: string
  progress: number | null
  status: 'active' | 'exploring'
}

export const currentTopics: CurrentTopic[] = [
  {
    name: 'MCP — Model Context Protocol',
    desc: '研究 MCP 协议设计与 Agent 工具集成模式',
    progress: null,
    status: 'active',
  },
  {
    name: 'Agent 架构 — planning + tool-use loop',
    desc: '基于 LangGraph 的多 agent 协作架构实践',
    progress: 40,
    status: 'exploring',
  },
  {
    name: 'Spring AI',
    desc: 'Spring 生态与 LLM 集成、RAG Pipeline 搭建',
    progress: 67,
    status: 'active',
  },
  {
    name: 'Go 微服务',
    desc: 'Goroutine + Channel 模式在生产中的应用',
    progress: 25,
    status: 'exploring',
  },
]