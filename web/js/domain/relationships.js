import { REF_GROUP_DEFS, WORLD_ENTITY_DEFS } from "../core/state.js";
import { relationships, state } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { storyEntityById } from "./entities.js";





/* 龙吟写作 · 关系图 */
    const GRAPH_TYPE_COLORS = {
      light: { character: "#386150", place: "#547b91", item: "#a97146", faction: "#7b6a91", species: "#3f7d70", event: "#b47b32", rule: "#a56c78" },
      dark: { character: "#8fd0ac", place: "#9cc3da", item: "#e0b285", faction: "#c3b4d8", species: "#8fd0be", event: "#e0b278", rule: "#dbaebc" }
    };

    export function graphColor(type) {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      const palette = dark ? GRAPH_TYPE_COLORS.dark : GRAPH_TYPE_COLORS.light;
      return palette[type] || (dark ? "#a6aea4" : "#687067");
    }

    export function graphTypeLabel(type) { return WORLD_ENTITY_DEFS[type]?.label || REF_GROUP_DEFS[type]?.label || type; }

    export function graphRelsOf(id) { return relationships.filter(relation => (relation.from === id || relation.to === id) && (state.relationScope === "all" || relation.scope === state.relationScope)); }

    let graphHoverId = null;

    export function setGraphHoverId(value) { graphHoverId = value; }

    function graphSetHover(id) {
      if (graphHoverId === id) return;
      graphHoverId = id;
      const svg = document.querySelector(".graph-stage-svg");
      const tip = document.getElementById("graph-tip");
      if (!svg) return;
      svg.querySelectorAll(".graph-dim").forEach(el => el.classList.remove("graph-dim"));
      svg.querySelectorAll(".edge-active").forEach(el => el.classList.remove("edge-active"));
      svg.querySelectorAll(".edge-pulse").forEach(el => el.remove());
      svg.querySelectorAll(".chord-active").forEach(el => el.classList.remove("chord-active"));
      if (tip) tip.style.display = "none";
      if (!id) return;
      if (id.startsWith("dial:")) {
        const type = id.slice(5);
        svg.querySelectorAll("[data-graph-dial]").forEach(dial => { if (dial.dataset.graphDial !== type) dial.classList.add("graph-dim"); });
        svg.querySelectorAll(".graph-chord").forEach(chord => { if (chord.dataset.chord.split("|").includes(type)) { chord.classList.add("chord-active"); chord.setAttribute("stroke-opacity", ".38"); chord.setAttribute("stroke", graphColor(type)); } else chord.classList.add("graph-dim"); });
        return;
      }
      const edges = [...svg.querySelectorAll(".graph-edge")];
      const active = edges.filter(edge => edge.dataset.edgeA === id || edge.dataset.edgeB === id);
      const neighbor = new Set([id]);
      active.forEach(edge => { neighbor.add(edge.dataset.edgeA); neighbor.add(edge.dataset.edgeB); });
      svg.querySelectorAll("[data-graph-node]").forEach(nodeEl => { if (!neighbor.has(nodeEl.dataset.graphNode)) nodeEl.classList.add("graph-dim"); });
      edges.forEach(edge => { if (active.includes(edge)) edge.classList.add("edge-active"); else edge.classList.add("graph-dim"); });
      active.slice(0, 2).forEach((edge, i) => {
        const line = edge.querySelector("line");
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute("class", "edge-pulse");
        pulse.setAttribute("r", "3");
        pulse.setAttribute("fill", line.getAttribute("stroke"));
        pulse.dataset.x1 = line.getAttribute("x1"); pulse.dataset.y1 = line.getAttribute("y1");
        pulse.dataset.x2 = line.getAttribute("x2"); pulse.dataset.y2 = line.getAttribute("y2");
        pulse.dataset.offset = String(i * .5);
        edge.appendChild(pulse);
      });
      const entity = storyEntityById(id);
      if (tip && entity) {
        tip.innerHTML = `<strong>${escapeHtml(entity.name)}</strong>${escapeHtml(entity.label || "")} · ${graphRelsOf(id).length} 条关系${entity.summary ? `<br>${escapeHtml(String(entity.summary).slice(0, 46))}` : ""}`;
        tip.style.display = "block";
      }
    }

    document.addEventListener("mouseover", event => {
      const node = event.target.closest ? event.target.closest("[data-graph-node]") : null;
      if (node) { graphSetHover(node.dataset.graphNode); return; }
      const dial = event.target.closest ? event.target.closest("[data-graph-dial]") : null;
      if (dial) { graphSetHover(`dial:${dial.dataset.graphDial}`); return; }
      if (graphHoverId && !(event.target.closest && event.target.closest(".graph-stage-svg"))) graphSetHover(null);
    });

    document.addEventListener("mousemove", event => {
      const tip = document.getElementById("graph-tip");
      if (!tip || tip.style.display !== "block") return;
      const stage = tip.parentElement.getBoundingClientRect();
      const x = Math.min(stage.width - 240, Math.max(8, event.clientX - stage.left + 14));
      const y = Math.min(stage.height - 90, Math.max(8, event.clientY - stage.top + 12));
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    });

    (function graphPulseLoop() {
      requestAnimationFrame(graphPulseLoop);
      try {
        if (state.graphPaused || document.hidden) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const pulses = document.querySelectorAll(".edge-pulse");
        if (!pulses.length) return;
        const ts = performance.now();
        pulses.forEach(pulse => {
          const t = ((ts / 1600) + Number(pulse.dataset.offset || 0)) % 1;
          const x1 = Number(pulse.dataset.x1), y1 = Number(pulse.dataset.y1), x2 = Number(pulse.dataset.x2), y2 = Number(pulse.dataset.y2);
          pulse.setAttribute("cx", x1 + (x2 - x1) * t);
          pulse.setAttribute("cy", y1 + (y2 - y1) * t);
        });
      } catch (error) { /* 单帧异常忽略 */ }
    })();
