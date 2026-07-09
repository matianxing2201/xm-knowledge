# Knowledge Graph Stays Hand-Written SVG + motion-v (No Graph Library)

The on-hero knowledge graph is rendered as inline SVG with motion-v, exactly as `KnowledgeCore.vue` already does. The requested "nodes lightly attracted to cursor" effect is implemented with an attraction function (per-node distance-to-cursor check → translate a few px toward cursor → `useSpring` pulls it back), not a force-directed simulation.

Justification: the graph is fixed at 5 nodes (AI / Java / Go / Web + center) on a static radial layout. A force-directed engine (d3-force, antv/g6, cytoscape) would buy capability we don't need — drag, zoom, clustering, hundreds of nodes — at the cost of a new dependency, a Vue integration wrapper, and a larger concept surface to maintain. motion-v's spring primitives already exist and already satisfy the spring-back behavior for free.

Rejected: d3-force + SVG (viable upgrade path *if* the graph later grows to many draggable nodes); full graph library (overkill at this node count and locks us into a component's mental model).

Reversal cost: medium-high — a later migration to a library would rewrite the component, so recording the decision now keeps the "why not a graph library" answer findable.