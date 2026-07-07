export interface RoadmapNode {
  label: string;
  desc?: string;
  status: "done" | "active" | "planned";
}

export interface Roadmap {
  id: string;
  title: string;
  nodes: RoadmapNode[];
}

export const roadmap: Roadmap = {
  id: "main",
  title: "Main Roadmap",
  nodes: [
    { label: "Java", desc: "后端基础", status: "done" },
    { label: "Spring", desc: "框架", status: "done" },
    { label: "Docker", desc: "容器化", status: "done" },
    { label: "Go", desc: "云原生语言", status: "active" },
    { label: "AI", desc: "LLM 入门", status: "active" },
    { label: "Agent", desc: "智能体", status: "planned" },
    { label: "MCP", desc: "工具协议", status: "planned" },
  ],
};
