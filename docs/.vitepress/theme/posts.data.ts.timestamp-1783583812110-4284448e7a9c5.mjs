// docs/.vitepress/theme/posts.data.ts
import { createContentLoader } from "file:///Users/mtx/Documents/web/xm-knowledge/node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.55.1_lightningcss@1.32.0_postcss@8.5.16_search-insights@2.17.3/node_modules/vitepress/dist/node/index.js";
var CATEGORY_MAP = {
  ai: "AI",
  java: "Java",
  go: "Go",
  web: "Web"
};
function stripFrontmatter(src) {
  return src.replace(/^---[\s\S]*?---/, "");
}
function countWords(text) {
  return text.replace(/\s+/g, "").length;
}
function makeExcerpt(text, limit = 110) {
  const cleaned = text.replace(/#+\s+/g, "").replace(/!?\[.*?\]\(.*?\)/g, "").replace(/\[.*?\]\(.*?\)/g, "$1").replace(/[`*_>#\-|]/g, "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return cleaned.slice(0, limit).replace(/\s+\S*$/, "") + "\u2026";
}
var posts_data_default = createContentLoader("**/*.md", {
  excerpt: false,
  srcExclude: ["**/superpowers/**"],
  transform(rawData) {
    return rawData.map((page) => {
      const content = stripFrontmatter(page.src || "");
      const seg = (page.url || "").split("/").filter(Boolean)[0];
      const category = CATEGORY_MAP[seg?.toLowerCase()] || "";
      const words = countWords(content);
      return {
        title: page.frontmatter.title || "",
        date: page.frontmatter.date || "",
        lastUpdated: page.frontmatter.lastUpdated || page.frontmatter.date || "",
        tags: page.frontmatter.tags || [],
        url: page.url,
        category,
        words,
        readingTime: Math.ceil(words / 300),
        excerpt: makeExcerpt(content)
      };
    }).filter(
      (post) => post.date !== "" && post.title !== "" && post.category !== ""
    );
  }
});
export {
  posts_data_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy8udml0ZXByZXNzL3RoZW1lL3Bvc3RzLmRhdGEudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbXR4L0RvY3VtZW50cy93ZWIveG0ta25vd2xlZGdlL2RvY3MvLnZpdGVwcmVzcy90aGVtZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL210eC9Eb2N1bWVudHMvd2ViL3htLWtub3dsZWRnZS9kb2NzLy52aXRlcHJlc3MvdGhlbWUvcG9zdHMuZGF0YS50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbXR4L0RvY3VtZW50cy93ZWIveG0ta25vd2xlZGdlL2RvY3MvLnZpdGVwcmVzcy90aGVtZS9wb3N0cy5kYXRhLnRzXCI7aW1wb3J0IHsgY3JlYXRlQ29udGVudExvYWRlciB9IGZyb20gJ3ZpdGVwcmVzcydcblxuZXhwb3J0IGludGVyZmFjZSBQb3N0IHtcbiAgdGl0bGU6IHN0cmluZ1xuICBkYXRlOiBzdHJpbmdcbiAgbGFzdFVwZGF0ZWQ6IHN0cmluZ1xuICB0YWdzOiBzdHJpbmdbXVxuICB1cmw6IHN0cmluZ1xuICBjYXRlZ29yeTogJ0FJJyB8ICdKYXZhJyB8ICdHbycgfCAnV2ViJ1xuICB3b3JkczogbnVtYmVyXG4gIHJlYWRpbmdUaW1lOiBudW1iZXJcbiAgZXhjZXJwdDogc3RyaW5nXG59XG5cbmNvbnN0IENBVEVHT1JZX01BUDogUmVjb3JkPHN0cmluZywgUG9zdFsnY2F0ZWdvcnknXT4gPSB7XG4gIGFpOiAnQUknLFxuICBqYXZhOiAnSmF2YScsXG4gIGdvOiAnR28nLFxuICB3ZWI6ICdXZWInLFxufVxuXG5mdW5jdGlvbiBzdHJpcEZyb250bWF0dGVyKHNyYzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHNyYy5yZXBsYWNlKC9eLS0tW1xcc1xcU10qPy0tLS8sICcnKVxufVxuXG5mdW5jdGlvbiBjb3VudFdvcmRzKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL1xccysvZywgJycpLmxlbmd0aFxufVxuXG5mdW5jdGlvbiBtYWtlRXhjZXJwdCh0ZXh0OiBzdHJpbmcsIGxpbWl0ID0gMTEwKTogc3RyaW5nIHtcbiAgY29uc3QgY2xlYW5lZCA9IHRleHRcbiAgICAucmVwbGFjZSgvIytcXHMrL2csICcnKVxuICAgIC5yZXBsYWNlKC8hP1xcWy4qP1xcXVxcKC4qP1xcKS9nLCAnJylcbiAgICAucmVwbGFjZSgvXFxbLio/XFxdXFwoLio/XFwpL2csICckMScpXG4gICAgLnJlcGxhY2UoL1tgKl8+I1xcLXxdL2csICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJylcbiAgICAudHJpbSgpXG4gIGlmIChjbGVhbmVkLmxlbmd0aCA8PSBsaW1pdCkgcmV0dXJuIGNsZWFuZWRcbiAgcmV0dXJuIGNsZWFuZWQuc2xpY2UoMCwgbGltaXQpLnJlcGxhY2UoL1xccytcXFMqJC8sICcnKSArICdcdTIwMjYnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZUNvbnRlbnRMb2FkZXIoJyoqLyoubWQnLCB7XG4gIGV4Y2VycHQ6IGZhbHNlLFxuICBzcmNFeGNsdWRlOiBbJyoqL3N1cGVycG93ZXJzLyoqJ10sXG4gIHRyYW5zZm9ybShyYXdEYXRhKTogUG9zdFtdIHtcbiAgICByZXR1cm4gcmF3RGF0YVxuICAgICAgLm1hcCgocGFnZSkgPT4ge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gc3RyaXBGcm9udG1hdHRlcihwYWdlLnNyYyB8fCAnJylcbiAgICAgICAgY29uc3Qgc2VnID0gKHBhZ2UudXJsIHx8ICcnKS5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKVswXVxuICAgICAgICBjb25zdCBjYXRlZ29yeSA9IENBVEVHT1JZX01BUFtzZWc/LnRvTG93ZXJDYXNlKCldIHx8ICcnXG5cbiAgICAgICAgY29uc3Qgd29yZHMgPSBjb3VudFdvcmRzKGNvbnRlbnQpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0aXRsZTogKHBhZ2UuZnJvbnRtYXR0ZXIudGl0bGUgYXMgc3RyaW5nKSB8fCAnJyxcbiAgICAgICAgICBkYXRlOiAocGFnZS5mcm9udG1hdHRlci5kYXRlIGFzIHN0cmluZykgfHwgJycsXG4gICAgICAgICAgbGFzdFVwZGF0ZWQ6IChwYWdlLmZyb250bWF0dGVyLmxhc3RVcGRhdGVkIGFzIHN0cmluZykgfHwgKHBhZ2UuZnJvbnRtYXR0ZXIuZGF0ZSBhcyBzdHJpbmcpIHx8ICcnLFxuICAgICAgICAgIHRhZ3M6IChwYWdlLmZyb250bWF0dGVyLnRhZ3MgYXMgc3RyaW5nW10pIHx8IFtdLFxuICAgICAgICAgIHVybDogcGFnZS51cmwsXG4gICAgICAgICAgY2F0ZWdvcnk6IGNhdGVnb3J5IGFzIFBvc3RbJ2NhdGVnb3J5J10sXG4gICAgICAgICAgd29yZHMsXG4gICAgICAgICAgcmVhZGluZ1RpbWU6IE1hdGguY2VpbCh3b3JkcyAvIDMwMCksXG4gICAgICAgICAgZXhjZXJwdDogbWFrZUV4Y2VycHQoY29udGVudCksXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuZmlsdGVyKChwb3N0KTogcG9zdCBpcyBQb3N0ID0+XG4gICAgICAgIHBvc3QuZGF0ZSAhPT0gJycgJiYgcG9zdC50aXRsZSAhPT0gJycgJiYgcG9zdC5jYXRlZ29yeSAhPT0gJydcbiAgICAgIClcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWlXLFNBQVMsMkJBQTJCO0FBY3JZLElBQU0sZUFBaUQ7QUFBQSxFQUNyRCxJQUFJO0FBQUEsRUFDSixNQUFNO0FBQUEsRUFDTixJQUFJO0FBQUEsRUFDSixLQUFLO0FBQ1A7QUFFQSxTQUFTLGlCQUFpQixLQUFxQjtBQUM3QyxTQUFPLElBQUksUUFBUSxtQkFBbUIsRUFBRTtBQUMxQztBQUVBLFNBQVMsV0FBVyxNQUFzQjtBQUN4QyxTQUFPLEtBQUssUUFBUSxRQUFRLEVBQUUsRUFBRTtBQUNsQztBQUVBLFNBQVMsWUFBWSxNQUFjLFFBQVEsS0FBYTtBQUN0RCxRQUFNLFVBQVUsS0FDYixRQUFRLFVBQVUsRUFBRSxFQUNwQixRQUFRLHFCQUFxQixFQUFFLEVBQy9CLFFBQVEsbUJBQW1CLElBQUksRUFDL0IsUUFBUSxlQUFlLEVBQUUsRUFDekIsUUFBUSxRQUFRLEdBQUcsRUFDbkIsS0FBSztBQUNSLE1BQUksUUFBUSxVQUFVLE1BQU8sUUFBTztBQUNwQyxTQUFPLFFBQVEsTUFBTSxHQUFHLEtBQUssRUFBRSxRQUFRLFdBQVcsRUFBRSxJQUFJO0FBQzFEO0FBRUEsSUFBTyxxQkFBUSxvQkFBb0IsV0FBVztBQUFBLEVBQzVDLFNBQVM7QUFBQSxFQUNULFlBQVksQ0FBQyxtQkFBbUI7QUFBQSxFQUNoQyxVQUFVLFNBQWlCO0FBQ3pCLFdBQU8sUUFDSixJQUFJLENBQUMsU0FBUztBQUNiLFlBQU0sVUFBVSxpQkFBaUIsS0FBSyxPQUFPLEVBQUU7QUFDL0MsWUFBTSxPQUFPLEtBQUssT0FBTyxJQUFJLE1BQU0sR0FBRyxFQUFFLE9BQU8sT0FBTyxFQUFFLENBQUM7QUFDekQsWUFBTSxXQUFXLGFBQWEsS0FBSyxZQUFZLENBQUMsS0FBSztBQUVyRCxZQUFNLFFBQVEsV0FBVyxPQUFPO0FBRWhDLGFBQU87QUFBQSxRQUNMLE9BQVEsS0FBSyxZQUFZLFNBQW9CO0FBQUEsUUFDN0MsTUFBTyxLQUFLLFlBQVksUUFBbUI7QUFBQSxRQUMzQyxhQUFjLEtBQUssWUFBWSxlQUEyQixLQUFLLFlBQVksUUFBbUI7QUFBQSxRQUM5RixNQUFPLEtBQUssWUFBWSxRQUFxQixDQUFDO0FBQUEsUUFDOUMsS0FBSyxLQUFLO0FBQUEsUUFDVjtBQUFBLFFBQ0E7QUFBQSxRQUNBLGFBQWEsS0FBSyxLQUFLLFFBQVEsR0FBRztBQUFBLFFBQ2xDLFNBQVMsWUFBWSxPQUFPO0FBQUEsTUFDOUI7QUFBQSxJQUNGLENBQUMsRUFDQTtBQUFBLE1BQU8sQ0FBQyxTQUNQLEtBQUssU0FBUyxNQUFNLEtBQUssVUFBVSxNQUFNLEtBQUssYUFBYTtBQUFBLElBQzdEO0FBQUEsRUFDSjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
