<script setup lang="ts">
import { ref } from 'vue'

interface FileNode {
  name: string
  type: 'folder' | 'file'
  link?: string
  children?: FileNode[]
}

const props = defineProps<{ items: FileNode[] }>()

const expanded = ref<Record<string, boolean>>({})

// Init all folders as expanded
function init(nodes: FileNode[], parentKey = '') {
  for (const node of nodes) {
    const key = parentKey ? `${parentKey}/${node.name}` : node.name
    if (node.type === 'folder' && !(key in expanded.value)) {
      expanded.value[key] = true
    }
    if (node.children) init(node.children, key)
  }
}

init(props.items)

function toggle(key: string) {
  expanded.value[key] = !expanded.value[key]
}

function getKey(parentKey: string, name: string) {
  return parentKey ? `${parentKey}/${name}` : name
}
</script>

<template>
  <div class="file-tree not-prose">
    <template v-for="(node, i) in items" :key="i">
      <!-- Folder -->
      <div v-if="node.type === 'folder'" class="tree-folder-wrap">
        <div class="tree-item tree-folder" @click="toggle(getKey('', node.name))">
          <span class="tree-arrow" :class="{ open: expanded[getKey('', node.name)] !== false }">▶</span>
          <span class="tree-icon">📂</span>
          <span class="tree-name">{{ node.name }}</span>
        </div>
        <template v-if="node.children && expanded[getKey('', node.name)] !== false">
          <template v-for="(child, ci) in node.children" :key="ci">
            <!-- Level 2 file -->
            <a v-if="child.type === 'file' && child.link" :href="child.link" class="tree-item tree-file" style="padding-left: 40px">
              <span class="tree-icon">📄</span>
              <span class="tree-name">{{ child.name }}</span>
            </a>
            <!-- Level 2 folder -->
            <div v-else-if="child.type === 'folder'" class="tree-folder-wrap">
              <div class="tree-item tree-folder" style="padding-left: 20px" @click="toggle(getKey(node.name, child.name))">
                <span class="tree-arrow" :class="{ open: expanded[getKey(node.name, child.name)] !== false }">▶</span>
                <span class="tree-icon">📂</span>
                <span class="tree-name">{{ child.name }}</span>
              </div>
              <template v-if="child.children && expanded[getKey(node.name, child.name)] !== false">
                <template v-for="(gc, gi) in child.children" :key="gi">
                  <a v-if="gc.type === 'file' && gc.link" :href="gc.link" class="tree-item tree-file" style="padding-left: 60px">
                    <span class="tree-icon">📄</span>
                    <span class="tree-name">{{ gc.name }}</span>
                  </a>
                  <div v-else-if="gc.type === 'folder'" class="tree-folder-wrap">
                    <div class="tree-item tree-folder" style="padding-left: 40px" @click="toggle(getKey(getKey(node.name, child.name), gc.name))">
                      <span class="tree-arrow" :class="{ open: expanded[getKey(getKey(node.name, child.name), gc.name)] !== false }">▶</span>
                      <span class="tree-icon">📂</span>
                      <span class="tree-name">{{ gc.name }}</span>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </template>
        </template>
      </div>
      <!-- Top-level file -->
      <a v-else-if="node.type === 'file' && node.link" :href="node.link" class="tree-item tree-file">
        <span class="tree-icon">📄</span>
        <span class="tree-name">{{ node.name }}</span>
      </a>
    </template>
  </div>
</template>

<style scoped>
.file-tree {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px 0;
  background: var(--color-card);
  font-size: 14px;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: var(--color-text);
  text-decoration: none;
  transition: background 180ms ease;
  border-radius: 6px;
  margin: 0 4px;
  cursor: pointer;
}

.tree-folder:hover,
.tree-file:hover {
  background: rgba(217, 119, 6, 0.06);
}

.tree-arrow {
  font-size: 10px;
  color: var(--color-text-secondary);
  transition: transform 200ms ease;
  width: 12px;
  text-align: center;
  flex-shrink: 0;
  display: inline-block;
}

.tree-arrow.open {
  transform: rotate(90deg);
}

.tree-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.tree-name {
  font-weight: 500;
}

.tree-file .tree-name {
  color: var(--color-text-secondary);
  font-weight: 400;
}

.tree-file:hover .tree-name {
  color: var(--color-primary);
}
</style>
