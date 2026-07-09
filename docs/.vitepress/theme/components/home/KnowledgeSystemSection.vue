<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'
import { data as knowledgeTree } from '../../tree.data.ts'
import { useCurrentTopics } from '../../composables/useCurrentTopics'
import { useRoadmap } from '../../composables/useRoadmap'
import type { TreeNode } from '../../tree.data.ts'

const expanded = ref<Set<string>>(new Set(['AI']))
function toggle(label: string) {
  if (expanded.value.has(label)) expanded.value.delete(label)
  else expanded.value.add(label)
}
function isExpanded(label: string) { return expanded.value.has(label) }

function hasChildren(node: TreeNode): boolean {
  return Boolean(node.children && node.children.length > 0)
}

const currentTopics = useCurrentTopics()
const roadmap = useRoadmap()
const statusClass: Record<string, string> = {
  done: 'border-primary bg-primary/25 text-primary',
  active: 'border-primary bg-primary text-white',
  planned: 'border-border bg-card text-text-secondary',
}
const statusLabel: Record<string, string> = {
  done: 'Done',
  active: 'Active',
  planned: 'Planned',
}
</script>

<template>
  <section class="max-w-[var(--content-max)] mx-auto px-[var(--gutter-desktop)] py-[var(--section-space)] max-lg:px-[var(--gutter-tablet)] max-sm:px-[var(--gutter-mobile)]">
    <h2 class="text-[36px] font-heading font-bold text-text max-sm:text-[28px] tracking-[-0.01em] mb-8">Knowledge System</h2>

    <div class="grid grid-cols-[40%_60%] gap-10 max-md:grid-cols-1">
      <!-- Left: terminal tree -->
      <div class="tree text-[14px] font-code text-text leading-[1.9]">
        <template v-for="domain in knowledgeTree" :key="domain.name">
          <div class="flex items-center gap-0">
            <button class="tree-toggle" @click="toggle(domain.name)">
              <span>{{ isExpanded(domain.name) ? '▾' : '▸' }}</span>
            </button>
            <span class="font-bold" :style="{ color: domain.accent }">{{ domain.name }}</span>
          </div>
          <template v-if="isExpanded(domain.name)">
            <div v-for="(node, ni) in domain.children" :key="node.path" class="flex items-start gap-0">
              <span class="tree-branch">{{ ni === domain.children.length - 1 ? '└── ' : '├── ' }}</span>
              <div v-if="hasChildren(node)" class="flex-1">
                <button class="inline-flex items-center gap-0.5 text-text-secondary hover:text-primary transition-colors" @click="toggle(node.path)">
                  <span class="text-[11px]">{{ isExpanded(node.path) ? '▾' : '▸' }}</span>
                  <span>{{ node.name }}</span>
                </button>
                <div v-if="isExpanded(node.path)" class="ml-4">
                  <div v-for="(child, ci) in node.children" :key="child.path" class="flex items-center gap-0">
                    <span class="tree-branch">{{ ci === node.children!.length - 1 ? '└── ' : '├── ' }}</span>
                    <a v-if="child.href" :href="withBase(child.href)" class="text-text hover:text-primary transition-colors truncate">{{ child.name }}</a>
                    <span v-else class="text-text-secondary">{{ child.name }}</span>
                  </div>
                </div>
              </div>
              <a v-else-if="node.href" :href="withBase(node.href)" class="text-text hover:text-primary transition-colors truncate">{{ node.name }}</a>
              <span v-else class="text-text-secondary">{{ node.name }}</span>
            </div>
          </template>
        </template>
      </div>

      <!-- Right: currently working on -->
      <div class="flex flex-col gap-3">
        <span class="text-[11px] text-text-secondary uppercase tracking-[0.08em] font-code mb-1">Currently Working On</span>
        <a v-for="topic in currentTopics" :key="topic.url"
           :href="withBase(topic.url)"
           class="group p-4 rounded-[var(--radius-card)] border border-border bg-card transition-all duration-[180ms] hover:border-primary/40 hover:-translate-y-0.5">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[15px] font-bold text-text font-heading group-hover:text-primary transition-colors line-clamp-1">{{ topic.name }}</span>
            <span class="flex items-center gap-1.5 shrink-0">
              <span class="w-2 h-2 rounded-full" :class="topic.status === 'active' ? 'bg-primary animate-pulse' : 'border border-text-secondary'"/>
              <span v-if="topic.progress !== null" class="text-[12px] font-code text-text-secondary">{{ topic.progress }}%</span>
              <span v-else class="text-[11px] font-code px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{{ topic.status }}</span>
            </span>
          </div>
          <p class="text-[13px] font-body text-text-secondary line-clamp-2">{{ topic.desc }}</p>
        </a>
      </div>
    </div>

    <!-- Roadmap -->
    <div class="mt-12">
      <span class="text-[11px] text-text-secondary uppercase tracking-[0.08em] font-code mb-4 block">Roadmap</span>
      <div class="relative overflow-x-auto pb-2">
        <svg class="absolute top-[4px] left-0 w-full h-0.5 opacity-20 pointer-events-none" viewBox="0 0 1200 4" preserveAspectRatio="none">
          <path d="M0,2 L1200,2" stroke="var(--color-primary)" stroke-width="2" fill="none"/>
        </svg>
        <div class="flex">
          <div v-for="(node, i) in roadmap.nodes" :key="node.label"
               class="flex flex-col items-center gap-2 min-w-[140px] max-sm:min-w-[90px]">
            <div class="w-2.5 h-2.5 rounded-full border-2" :class="statusClass[node.status]"
                 :style="node.status === 'active' ? 'animation: pulse-ring 2.5s ease-in-out infinite' : ''"/>
            <span class="text-[14px] font-semibold text-text text-center font-body">{{ node.label }}</span>
            <span v-if="node.desc" class="text-[12px] text-text-secondary text-center font-body">{{ node.desc }}</span>
            <span class="text-[11px] font-code uppercase tracking-[0.08em]" :class="node.status === 'active' ? 'text-primary' : 'text-text-secondary'">
              {{ statusLabel[node.status] }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tree-toggle {
  width: 20px;
  display: inline-flex;
  justify-content: center;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.tree-toggle:hover { color: var(--color-primary); }

.tree-branch {
  width: 24px;
  flex-shrink: 0;
  text-align: center;
  color: var(--color-text-secondary);
  opacity: 0.35;
  user-select: none;
}

@keyframes pulse-ring {
  0%, 100% { opacity: 0.8; box-shadow: 0 0 0 0 var(--color-primary); }
  50% { opacity: 1; box-shadow: 0 0 0 4px transparent; }
}
</style>