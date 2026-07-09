// docs/.vitepress/posts.data.ts
import { readdirSync, readFileSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///Users/mtx/Documents/web/xm-knowledge/docs/.vitepress/posts.data.ts";
var __dirname = dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var docsDir = resolve(__dirname, "..");
function getCategoryFromPath(filePath) {
  const rel = relative(docsDir, filePath).replace(/\\/g, "/");
  const firstSeg = rel.split("/")[0]?.toLowerCase();
  if (firstSeg === "ai") return "AI";
  if (firstSeg === "java") return "Java";
  if (firstSeg === "go") return "Go";
  if (firstSeg === "web") return "Web";
  return firstSeg ? firstSeg.charAt(0).toUpperCase() + firstSeg.slice(1) : "Other";
}
function stripContent(raw) {
  let content = raw.replace(/^---\n[\s\S]*?\n---/, "");
  content = content.replace(/```[\s\S]*?```/g, " ");
  content = content.replace(/`[^`]+`/g, " ");
  return content;
}
function countWords(text) {
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const cleaned = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, " ");
  const enWords = (cleaned.match(/[a-zA-Z0-9]+/g) || []).length;
  return cjkChars + enWords;
}
function computeReadingTime(words) {
  const cjkMinutes = words * 0.7 / 300;
  const enMinutes = words * 0.3 / 220;
  return Math.round(cjkMinutes + enMinutes);
}
function getLastUpdated(filePath) {
  try {
    const result = execSync(
      `git log -1 --format=%cI -- "${relative(resolve(docsDir, ".."), filePath)}"`,
      { cwd: resolve(docsDir, ".."), encoding: "utf-8", timeout: 5e3 }
    ).trim();
    return result || "";
  } catch {
    return "";
  }
}
function collectPosts(dir) {
  const posts = [];
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = resolve(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith(".")) {
      posts.push(...collectPosts(fullPath));
    } else if (item.isFile() && item.name.endsWith(".md") && !item.name.startsWith("index.md")) {
      try {
        const content = readFileSync(fullPath, "utf-8");
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
          const frontmatter = fmMatch[1];
          const title = frontmatter.match(/title:\s*(.+)/)?.[1].replace(/['"]/g, "") || "";
          const date = frontmatter.match(/date:\s*(.+)/)?.[1].replace(/['"]/g, "") || "";
          const tagsMatch = frontmatter.match(/tags:\s*(\[[^\]]*\]|".*?")/);
          const tags = tagsMatch ? JSON.parse(tagsMatch[1]) : [];
          if (title && date) {
            let url = relative(docsDir, fullPath).replace(/\\/g, "/").replace(/\.md$/, "");
            if (!url.startsWith("/")) {
              url = "/" + url;
            }
            if (!url.endsWith("/")) {
              url += "/";
            }
            const stripped = stripContent(content);
            const words = countWords(stripped);
            const category = getCategoryFromPath(fullPath);
            const lastUpdated = getLastUpdated(fullPath) || date;
            posts.push({
              title,
              date,
              tags,
              url,
              category,
              words,
              readingTime: computeReadingTime(words),
              lastUpdated
            });
          }
        }
      } catch {
        continue;
      }
    }
  }
  return posts;
}
var data = collectPosts(docsDir);
export {
  data
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy8udml0ZXByZXNzL3Bvc3RzLmRhdGEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbXR4L0RvY3VtZW50cy93ZWIveG0ta25vd2xlZGdlL2RvY3MvLnZpdGVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL210eC9Eb2N1bWVudHMvd2ViL3htLWtub3dsZWRnZS9kb2NzLy52aXRlcHJlc3MvcG9zdHMuZGF0YS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbXR4L0RvY3VtZW50cy93ZWIveG0ta25vd2xlZGdlL2RvY3MvLnZpdGVwcmVzcy9wb3N0cy5kYXRhLnRzXCI7aW1wb3J0IHsgcmVhZGRpclN5bmMsIHJlYWRGaWxlU3luYywgc3RhdFN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgcmVzb2x2ZSwgcmVsYXRpdmUsIGRpcm5hbWUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gXCJub2RlOmNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQb3N0IHtcbiAgdGl0bGU6IHN0cmluZztcbiAgZGF0ZTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgdXJsOiBzdHJpbmc7XG4gIGNhdGVnb3J5OiBzdHJpbmc7XG4gIHdvcmRzOiBudW1iZXI7XG4gIHJlYWRpbmdUaW1lOiBudW1iZXI7XG4gIGxhc3RVcGRhdGVkOiBzdHJpbmc7XG59XG5cbmNvbnN0IF9fZGlybmFtZSA9IGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcbmNvbnN0IGRvY3NEaXIgPSByZXNvbHZlKF9fZGlybmFtZSwgXCIuLlwiKTtcblxuZnVuY3Rpb24gZ2V0Q2F0ZWdvcnlGcm9tUGF0aChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcmVsID0gcmVsYXRpdmUoZG9jc0RpciwgZmlsZVBhdGgpLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xuICBjb25zdCBmaXJzdFNlZyA9IHJlbC5zcGxpdChcIi9cIilbMF0/LnRvTG93ZXJDYXNlKCk7XG4gIGlmIChmaXJzdFNlZyA9PT0gXCJhaVwiKSByZXR1cm4gXCJBSVwiO1xuICBpZiAoZmlyc3RTZWcgPT09IFwiamF2YVwiKSByZXR1cm4gXCJKYXZhXCI7XG4gIGlmIChmaXJzdFNlZyA9PT0gXCJnb1wiKSByZXR1cm4gXCJHb1wiO1xuICBpZiAoZmlyc3RTZWcgPT09IFwid2ViXCIpIHJldHVybiBcIldlYlwiO1xuICByZXR1cm4gZmlyc3RTZWcgPyBmaXJzdFNlZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGZpcnN0U2VnLnNsaWNlKDEpIDogXCJPdGhlclwiO1xufVxuXG5mdW5jdGlvbiBzdHJpcENvbnRlbnQocmF3OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgY29udGVudCA9IHJhdy5yZXBsYWNlKC9eLS0tXFxuW1xcc1xcU10qP1xcbi0tLS8sIFwiXCIpO1xuICBjb250ZW50ID0gY29udGVudC5yZXBsYWNlKC9gYGBbXFxzXFxTXSo/YGBgL2csIFwiIFwiKTtcbiAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZSgvYFteYF0rYC9nLCBcIiBcIik7XG4gIHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiBjb3VudFdvcmRzKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gIGNvbnN0IGNqa0NoYXJzID0gKHRleHQubWF0Y2goL1tcXHU0ZTAwLVxcdTlmZmZcXHUzNDAwLVxcdTRkYmZdL2cpIHx8IFtdKS5sZW5ndGg7XG4gIGNvbnN0IGNsZWFuZWQgPSB0ZXh0LnJlcGxhY2UoL1tcXHU0ZTAwLVxcdTlmZmZcXHUzNDAwLVxcdTRkYmZdL2csIFwiIFwiKTtcbiAgY29uc3QgZW5Xb3JkcyA9IChjbGVhbmVkLm1hdGNoKC9bYS16QS1aMC05XSsvZykgfHwgW10pLmxlbmd0aDtcbiAgcmV0dXJuIGNqa0NoYXJzICsgZW5Xb3Jkcztcbn1cblxuZnVuY3Rpb24gY29tcHV0ZVJlYWRpbmdUaW1lKHdvcmRzOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBjamtNaW51dGVzID0gKHdvcmRzICogMC43KSAvIDMwMDtcbiAgY29uc3QgZW5NaW51dGVzID0gKHdvcmRzICogMC4zKSAvIDIyMDtcbiAgcmV0dXJuIE1hdGgucm91bmQoY2prTWludXRlcyArIGVuTWludXRlcyk7XG59XG5cbmZ1bmN0aW9uIGdldExhc3RVcGRhdGVkKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGV4ZWNTeW5jKFxuICAgICAgYGdpdCBsb2cgLTEgLS1mb3JtYXQ9JWNJIC0tIFwiJHtyZWxhdGl2ZShyZXNvbHZlKGRvY3NEaXIsIFwiLi5cIiksIGZpbGVQYXRoKX1cImAsXG4gICAgICB7IGN3ZDogcmVzb2x2ZShkb2NzRGlyLCBcIi4uXCIpLCBlbmNvZGluZzogXCJ1dGYtOFwiLCB0aW1lb3V0OiA1MDAwIH1cbiAgICApLnRyaW0oKTtcbiAgICByZXR1cm4gcmVzdWx0IHx8IFwiXCI7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RQb3N0cyhkaXI6IHN0cmluZyk6IFBvc3RbXSB7XG4gIGNvbnN0IHBvc3RzOiBQb3N0W10gPSBbXTtcbiAgY29uc3QgaXRlbXMgPSByZWFkZGlyU3luYyhkaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcblxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICBjb25zdCBmdWxsUGF0aCA9IHJlc29sdmUoZGlyLCBpdGVtLm5hbWUpO1xuXG4gICAgaWYgKGl0ZW0uaXNEaXJlY3RvcnkoKSAmJiAhaXRlbS5uYW1lLnN0YXJ0c1dpdGgoXCIuXCIpKSB7XG4gICAgICBwb3N0cy5wdXNoKC4uLmNvbGxlY3RQb3N0cyhmdWxsUGF0aCkpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBpdGVtLmlzRmlsZSgpICYmXG4gICAgICBpdGVtLm5hbWUuZW5kc1dpdGgoXCIubWRcIikgJiZcbiAgICAgICFpdGVtLm5hbWUuc3RhcnRzV2l0aChcImluZGV4Lm1kXCIpXG4gICAgKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGZ1bGxQYXRoLCBcInV0Zi04XCIpO1xuICAgICAgICBjb25zdCBmbU1hdGNoID0gY29udGVudC5tYXRjaCgvXi0tLVxcbihbXFxzXFxTXSo/KVxcbi0tLS8pO1xuXG4gICAgICAgIGlmIChmbU1hdGNoKSB7XG4gICAgICAgICAgY29uc3QgZnJvbnRtYXR0ZXIgPSBmbU1hdGNoWzFdO1xuICAgICAgICAgIGNvbnN0IHRpdGxlID1cbiAgICAgICAgICAgIGZyb250bWF0dGVyLm1hdGNoKC90aXRsZTpcXHMqKC4rKS8pPy5bMV0ucmVwbGFjZSgvWydcIl0vZywgXCJcIikgfHwgXCJcIjtcbiAgICAgICAgICBjb25zdCBkYXRlID1cbiAgICAgICAgICAgIGZyb250bWF0dGVyLm1hdGNoKC9kYXRlOlxccyooLispLyk/LlsxXS5yZXBsYWNlKC9bJ1wiXS9nLCBcIlwiKSB8fCBcIlwiO1xuICAgICAgICAgIGNvbnN0IHRhZ3NNYXRjaCA9IGZyb250bWF0dGVyLm1hdGNoKC90YWdzOlxccyooXFxbW15cXF1dKlxcXXxcIi4qP1wiKS8pO1xuICAgICAgICAgIGNvbnN0IHRhZ3M6IHN0cmluZ1tdID0gdGFnc01hdGNoID8gSlNPTi5wYXJzZSh0YWdzTWF0Y2hbMV0pIDogW107XG5cbiAgICAgICAgICBpZiAodGl0bGUgJiYgZGF0ZSkge1xuICAgICAgICAgICAgbGV0IHVybCA9IHJlbGF0aXZlKGRvY3NEaXIsIGZ1bGxQYXRoKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXC9nLCBcIi9cIilcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcLm1kJC8sIFwiXCIpO1xuICAgICAgICAgICAgaWYgKCF1cmwuc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICAgICAgICAgICAgdXJsID0gXCIvXCIgKyB1cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXVybC5lbmRzV2l0aChcIi9cIikpIHtcbiAgICAgICAgICAgICAgdXJsICs9IFwiL1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzdHJpcHBlZCA9IHN0cmlwQ29udGVudChjb250ZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHdvcmRzID0gY291bnRXb3JkcyhzdHJpcHBlZCk7XG4gICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IGdldENhdGVnb3J5RnJvbVBhdGgoZnVsbFBhdGgpO1xuICAgICAgICAgICAgY29uc3QgbGFzdFVwZGF0ZWQgPSBnZXRMYXN0VXBkYXRlZChmdWxsUGF0aCkgfHwgZGF0ZTtcblxuICAgICAgICAgICAgcG9zdHMucHVzaCh7XG4gICAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgICBkYXRlLFxuICAgICAgICAgICAgICB0YWdzLFxuICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgIGNhdGVnb3J5LFxuICAgICAgICAgICAgICB3b3JkcyxcbiAgICAgICAgICAgICAgcmVhZGluZ1RpbWU6IGNvbXB1dGVSZWFkaW5nVGltZSh3b3JkcyksXG4gICAgICAgICAgICAgIGxhc3RVcGRhdGVkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBvc3RzO1xufVxuXG5leHBvcnQgY29uc3QgZGF0YSA9IGNvbGxlY3RQb3N0cyhk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
