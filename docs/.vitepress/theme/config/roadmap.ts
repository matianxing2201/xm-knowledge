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
    { label: "Web", desc: "基础", status: "planned" },
    { label: "Go", desc: "基础", status: "active" },
    { label: "Java", desc: "基础", status: "done" },
    { label: "AI", desc: "LLM 入门", status: "active" },
    { label: "Agent", desc: "智能体", status: "planned" },
    { label: "MCP", desc: "工具协议", status: "planned" },
  ],
};
