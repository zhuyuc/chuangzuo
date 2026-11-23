/* 龙吟写作 · 地图地形生成 */
    export const MAP_TERRAINS = [
      { key: "deep", label: "深水", color: "#27566b", level: 0 },
      { key: "water", label: "浅水", color: "#4e8ba1", level: 1 },
      { key: "sand", label: "沙地", color: "#d9cfa8", level: 2 },
      { key: "grass", label: "草地", color: "#a9bd8b", level: 3 },
      { key: "forest", label: "森林", color: "#66895c", level: 4 },
      { key: "hill", label: "丘陵", color: "#93996b", level: 5 },
      { key: "mountain", label: "山地", color: "#857f70", level: 6 },
      { key: "snow", label: "雪地", color: "#eef1ec", level: 7 }
    ];

    export function makeBlankMap() {
      const cols = 240, rows = 150;
      return { seed: Math.floor(Math.random() * 999999), cols, rows, grid: new Array(cols * rows).fill(1), elevation: new Array(cols * rows).fill(.2), rivers: [], rev: 0 };
    }

    function mapNoiseHash(x, y, seed) {
      let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }

    function mapNoise(x, y, seed) {
      const x0 = Math.floor(x), y0 = Math.floor(y);
      const fx = x - x0, fy = y - y0;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = mapNoiseHash(x0, y0, seed), b = mapNoiseHash(x0 + 1, y0, seed);
      const c = mapNoiseHash(x0, y0 + 1, seed), d = mapNoiseHash(x0 + 1, y0 + 1, seed);
      return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    }

    function mapFbm(x, y, seed) {
      let value = 0, amplitude = .58, frequency = 1;
      for (let i = 0; i < 4; i += 1) { value += mapNoise(x * frequency, y * frequency, seed + i * 47) * amplitude; amplitude *= .5; frequency *= 2; }
      return value;
    }

    function mapClamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

    function mapSmoothstep(edge0, edge1, value) {
      const t = mapClamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
      return t * t * (3 - 2 * t);
    }

    function mapShadeHex(hex, factor) {
      let r, g, b;
      if (hex[0] === "#") {
        const int = parseInt(hex.slice(1), 16);
        r = (int >> 16) & 255; g = (int >> 8) & 255; b = int & 255;
      } else {
        const parts = hex.match(/\d+/g) || [0, 0, 0];
        r = +parts[0]; g = +parts[1]; b = +parts[2];
      }
      r = mapClamp(Math.round(r * factor), 0, 255);
      g = mapClamp(Math.round(g * factor), 0, 255);
      b = mapClamp(Math.round(b * factor), 0, 255);
      return `rgb(${r},${g},${b})`;
    }

    function mapParseColor(color) {
      if (color[0] === "#") {
        const int = parseInt(color.slice(1), 16);
        return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
      }
      const parts = color.match(/\d+/g) || [0, 0, 0];
      return [+parts[0], +parts[1], +parts[2]];
    }

    function mapMixColor(a, b, t) {
      const pa = mapParseColor(a), pb = mapParseColor(b), k = mapClamp(t, 0, 1);
      return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * k)},${Math.round(pa[1] + (pb[1] - pa[1]) * k)},${Math.round(pa[2] + (pb[2] - pa[2]) * k)})`;
    }

    function mapMixHex(a, b, t) { return mapMixColor(a, b, t); }

    const MAP_HYPSO = [[.38, "#cfc49b"], [.5, "#8fae72"], [.6, "#9c8557"], [.7, "#8a7660"], [.82, "#b3aa9d"], [.9, "#eef1ec"]];

    function mapHypsoColor(e) {
      if (e <= MAP_HYPSO[0][0]) return MAP_HYPSO[0][1];
      for (let i = 1; i < MAP_HYPSO.length; i += 1) {
        if (e <= MAP_HYPSO[i][0]) return mapMixColor(MAP_HYPSO[i - 1][1], MAP_HYPSO[i][1], (e - MAP_HYPSO[i - 1][0]) / (MAP_HYPSO[i][0] - MAP_HYPSO[i - 1][0]));
      }
      return MAP_HYPSO[MAP_HYPSO.length - 1][1];
    }

    function mapOceanColor(e) {
      const t = mapClamp(e / .3, 0, 1);
      if (t < .55) return mapMixHex("#0d3145", "#1d5570", t / .55);
      if (t < .85) return mapMixHex("#1d5570", "#37788c", (t - .55) / .3);
      return mapMixHex("#37788c", "#79aeb4", (t - .85) / .15);
    }

    function mapLandColor(x, y, e, data) {
      const ny = y / (data.rows - 1);
      const temp = 1 - Math.abs(ny - .5) * 1.75 - Math.max(0, e - .55) * .95;
      const moisture = mapFbm(x * .041 * (160 / data.cols) + 300, y * .041 * (160 / data.cols) + 320, data.seed + 171);
      if (e < .425) return "#d9cfa8";
      if (e < .56) {
        if (moisture < .33 && temp > .52) return "#d2b584";
        if (moisture > .56 && temp > .34) return "#6d8f60";
        return "#a9bd8b";
      }
      if (e < .66) return moisture < .3 && temp > .5 ? "#c0a273" : "#9a9268";
      if (e < .82) return "#8b8172";
      return temp < .45 ? "#eef1ec" : "#a79d90";
    }

    let worldTerrainCache = { key: "", canvas: null };

    function computeShadeField(data) {
      const cols = data.cols, rows = data.rows, elevation = data.elevation;
      const hs = new Float32Array(cols * rows);
      const mag = new Float32Array(cols * rows);
      const wins = [1, 2, 4], zs = [80, 60, 45], ws = [.5, .3, .2];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          let sum = 0, m1 = 0;
          for (let w = 0; w < wins.length; w += 1) {
            const g = wins[w];
            const l = elevation[y * cols + Math.max(0, x - g)];
            const r = elevation[y * cols + Math.min(cols - 1, x + g)];
            const u = elevation[Math.max(0, y - g) * cols + x];
            const d = elevation[Math.min(rows - 1, y + g) * cols + x];
            const dzdx = (r - l) * zs[w] / (2 * g);
            const dzdy = (d - u) * zs[w] / (2 * g);
            const nx = -dzdx, ny = -dzdy;
            const len = Math.hypot(nx, ny, 1);
            sum += ws[w] * Math.max(0, (nx * -.55 + ny * -.55 + .63) / len);
            if (!w) m1 = Math.hypot(dzdx, dzdy);
          }
          hs[y * cols + x] = sum;
          mag[y * cols + x] = m1;
        }
      }
      return { hs, mag };
    }

    export function renderWorldTerrain(data) {
      const key = data.seed + ":" + data.cols + "x" + data.rows + ":" + (data.rev || 0);
      if (worldTerrainCache.key === key && worldTerrainCache.canvas) return worldTerrainCache.canvas;
      const SS = 2, W = 720 * SS, H = 500 * SS;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      const cellW = W / data.cols, cellH = H / data.rows;
      const hasElevation = Array.isArray(data.elevation) && data.elevation.length === data.grid.length;
      const shade = hasElevation ? computeShadeField(data) : null;
      const at = (x, y) => data.elevation[Math.min(data.rows - 1, Math.max(0, y)) * data.cols + Math.min(data.cols - 1, Math.max(0, x))];
      const oceanE = e => (e < .15 ? e * .4 : e - .09);
      ctx.fillStyle = mapOceanColor(0);
      ctx.fillRect(0, 0, W, H);
      data.grid.forEach((terrain, index) => {
        if (terrain >= 2) return;
        const x = index % data.cols, y = Math.floor(index / data.cols);
        const e = hasElevation ? data.elevation[index] : .2;
        const eo = oceanE(e);
        if (eo <= .02) return;
        ctx.fillStyle = mapOceanColor(eo);
        ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      });
      const coast = new Path2D();
      data.grid.forEach((terrain, index) => {
        if (terrain < 2) return;
        const x = index % data.cols, y = Math.floor(index / data.cols);
        const px = x * cellW, py = y * cellH;
        if (x === 0 || data.grid[index - 1] < 2) { coast.moveTo(px, py); coast.lineTo(px, py + cellH); }
        if (y === 0 || data.grid[index - data.cols] < 2) { coast.moveTo(px, py); coast.lineTo(px + cellW, py); }
        if (x === data.cols - 1 || data.grid[index + 1] < 2) { coast.moveTo(px + cellW, py); coast.lineTo(px + cellW, py + cellH); }
        if (y === data.rows - 1 || data.grid[index + data.cols] < 2) { coast.moveTo(px, py + cellH); coast.lineTo(px + cellW, py + cellH); }
      });
      ctx.strokeStyle = "rgba(8,28,38,.15)";
      ctx.lineWidth = 4.5 * SS;
      ctx.stroke(coast);
      ctx.strokeStyle = "rgba(8,28,38,.28)";
      ctx.lineWidth = 2 * SS;
      ctx.stroke(coast);
      data.grid.forEach((terrain, index) => {
        if (terrain < 2) return;
        const x = index % data.cols, y = Math.floor(index / data.cols);
        const e = hasElevation ? data.elevation[index] : .5;
        let color = mapMixColor(mapLandColor(x, y, e, data), mapHypsoColor(e), .35);
        if (e < .42) color = mapMixColor(color, "#b8c4c6", (0.42 - e) / .42 * .06);
        let factor = 1;
        if (shade) {
          let sum = 0;
          for (let oy = -2; oy <= 2; oy += 2) for (let ox = -2; ox <= 2; ox += 2) {
            if (!ox && !oy) continue;
            sum += at(x + ox, y + oy);
          }
          const ao = mapClamp(1 + (e - sum / 8) * 3.5, .85, 1.15);
          const hsG = Math.pow(shade.hs[index], 1.15);
          factor = mapClamp((.35 + hsG * 1.3) * ao * (1 + mapClamp((e - .5) * .16, 0, .09)) + (mapNoiseHash(x, y, data.seed + 5) - .5) * .06, .45, 1.55);
        }
        ctx.fillStyle = factor === 1 ? color : mapShadeHex(color, factor);
        ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
      });
      ctx.strokeStyle = "rgba(255,248,220,.5)";
      ctx.lineWidth = 1.2 * SS;
      ctx.stroke(coast);
      ctx.strokeStyle = "rgba(24,52,64,.55)";
      ctx.lineWidth = .8 * SS;
      ctx.stroke(coast);
      if (hasElevation) {
        [.22, .26].forEach(level => {
          const path = new Path2D();
          data.grid.forEach((terrain, index) => {
            if (terrain >= 2) return;
            const x = index % data.cols, y = Math.floor(index / data.cols);
            const e = data.elevation[index];
            const r = x + 1 < data.cols ? data.elevation[index + 1] : e;
            const d = y + 1 < data.rows ? data.elevation[index + data.cols] : e;
            const px = x * cellW, py = y * cellH;
            if ((e - level) * (r - level) < 0) { path.moveTo(px + cellW, py); path.lineTo(px + cellW, py + cellH); }
            if ((e - level) * (d - level) < 0) { path.moveTo(px, py + cellH); path.lineTo(px + cellW, py + cellH); }
          });
          ctx.strokeStyle = "rgba(226,242,244,.16)";
          ctx.lineWidth = .7 * SS;
          ctx.stroke(path);
        });
      }
      ctx.strokeStyle = "#7fb3c4";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      (data.rivers || []).forEach((river, index) => {
        ctx.beginPath();
        river.forEach((point, pIndex) => {
          const px = point.x * cellW, py = point.y * cellH;
          if (!pIndex) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.lineWidth = (index === 0 ? 2.6 : 1.6) * SS / 2;
        ctx.stroke();
      });
      if (shade) {
        ctx.strokeStyle = "rgba(52,44,34,.05)";
        ctx.lineWidth = .8 * SS;
        ctx.beginPath();
        for (let y = 0; y < data.rows; y += 2) {
          for (let x = 0; x < data.cols; x += 2) {
            const index = y * data.cols + x;
            if (data.grid[index] < 2 || shade.mag[index] < 1.2) continue;
            const dzdx = (at(x + 1, y) - at(x - 1, y)) * 40;
            const dzdy = (at(x, y + 1) - at(x, y - 1)) * 40;
            const len = Math.hypot(dzdx, dzdy) || 1;
            const dx = dzdx / len, dy = dzdy / len;
            const l = cellW * .8;
            const cx2 = (x + .5) * cellW, cy2 = (y + .5) * cellH;
            ctx.moveTo(cx2 - dx * l, cy2 - dy * l);
            ctx.lineTo(cx2 + dx * l, cy2 + dy * l);
          }
        }
        ctx.stroke();
      }
      const out = document.createElement("canvas");
      out.width = 720; out.height = 500;
      const octx = out.getContext("2d");
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = "high";
      octx.drawImage(canvas, 0, 0, 720, 500);
      worldTerrainCache = { key, canvas: out };
      return out;
    }

    export function generateWorldMap(seed = Math.floor(Math.random() * 999999)) {
      const cols = 240, rows = 150, grid = [];
      const fs = 160 / cols;
      const shapeRoll = mapNoiseHash(11, 13, seed + 991);
      const shape = shapeRoll < .42 ? "continent" : shapeRoll < .74 ? "archipelago" : "pangea";
      const warpX = (mapNoiseHash(3, 7, seed + 11) - .5) * 26;
      const warpY = (mapNoiseHash(9, 4, seed + 23) - .5) * 26;
      const cx = .3 + mapNoiseHash(5, 5, seed + 31) * .4;
      const cy = .3 + mapNoiseHash(7, 9, seed + 43) * .4;
      const baseArr = [], ridgeArr = [], detailArr = [], microArr = [], maskArr = [], moistArr = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const nx = x / (cols - 1), ny = y / (rows - 1);
          const wx = mapFbm(x * .021 * fs + warpX, y * .021 * fs + warpY, seed + 101) - .5;
          const wy = mapFbm(x * .021 * fs + warpY + 40, y * .021 * fs + warpX + 60, seed + 131) - .5;
          const sx = x + wx * 24, sy = y + wy * 24;
          const base = mapFbm(sx * .03 * fs, sy * .03 * fs, seed);
          const ridge = 1 - Math.abs(mapFbm(sx * .052 * fs + 70, sy * .052 * fs + 20, seed + 57) * 2 - 1);
          const detail = mapFbm(sx * .11 * fs + 13, sy * .11 * fs + 29, seed + 77);
          const micro = mapFbm(sx * .23 * fs + 51, sy * .23 * fs + 63, seed + 91);
          const dx = nx - cx, dy = (ny - cy) * (rows / cols);
          const radius = Math.sqrt(dx * dx + dy * dy);
          let mask;
          if (shape === "continent") mask = 1 - mapSmoothstep(.26, .6, radius + (base - .5) * .2);
          else if (shape === "archipelago") mask = mapClamp((mapFbm(x * .05 * fs + 200, y * .05 * fs + 210, seed + 151) - .44) * 3.4, 0, 1) * (1 - mapSmoothstep(.52, .86, radius));
          else mask = 1 - mapSmoothstep(.4, .74, radius + (base - .5) * .34);
          baseArr.push(base); ridgeArr.push(ridge); detailArr.push(detail); microArr.push(micro); maskArr.push(mask);
          moistArr.push(mapFbm(x * .041 * fs + 300, y * .041 * fs + 320, seed + 171));
        }
      }
      const labels = new Int32Array(cols * rows).fill(-1);
      const comps = [];
      for (let i = 0; i < labels.length; i += 1) {
        if (maskArr[i] <= .45 || labels[i] !== -1) continue;
        const id = comps.length;
        const stack = [i];
        labels[i] = id;
        let minX = cols, maxX = 0, minY = rows, maxY = 0, sumX = 0, sumY = 0, count = 0;
        while (stack.length) {
          const cur = stack.pop();
          count += 1;
          const cx2 = cur % cols, cy2 = Math.floor(cur / cols);
          if (cx2 < minX) minX = cx2;
          if (cx2 > maxX) maxX = cx2;
          if (cy2 < minY) minY = cy2;
          if (cy2 > maxY) maxY = cy2;
          sumX += cx2; sumY += cy2;
          const nbs = [cur - 1, cur + 1, cur - cols, cur + cols];
          for (const n of nbs) {
            if (n < 0 || n >= labels.length) continue;
            if ((n === cur - 1 && cx2 === 0) || (n === cur + 1 && cx2 === cols - 1)) continue;
            if (maskArr[n] > .45 && labels[n] === -1) { labels[n] = id; stack.push(n); }
          }
        }
        comps.push({ id, count, cx: sumX / count, cy: sumY / count, extent: Math.max(maxX - minX, maxY - minY) / 2, klass: "small" });
      }
      const belts = [], basins = [];
      const compBelts = comps.map(() => []), compBasins = comps.map(() => []);
      comps.forEach(comp => {
        const areaFrac = comp.count / (cols * rows);
        comp.klass = areaFrac >= .05 ? "continent" : areaFrac >= .015 ? "mid" : "small";
        if (comp.klass === "small") {
          if (mapNoiseHash(comp.id + 3, 9, seed + 7) < .5) {
            basins.push({ x: comp.cx, y: comp.cy, r: Math.max(4, comp.extent * .55), amp: .9, kind: "cone" });
            compBasins[comp.id].push(basins.length - 1);
          }
          return;
        }
        const beltCount = comp.klass === "continent" && areaFrac > .12 ? 2 : 1;
        for (let b = 0; b < beltCount; b += 1) {
          const angle = mapNoiseHash(comp.id * 7 + b, 5, seed + 17) * Math.PI;
          const half = comp.extent * (.5 + mapNoiseHash(comp.id + b, 11, seed + 29) * .4);
          const ox = comp.cx + (mapNoiseHash(b + 1, comp.id + 2, seed + 37) - .5) * comp.extent * .5;
          const oy = comp.cy + (mapNoiseHash(comp.id + 4, b + 3, seed + 41) - .5) * comp.extent * .5;
          belts.push({ x1: ox - Math.cos(angle) * half, y1: oy - Math.sin(angle) * half, x2: ox + Math.cos(angle) * half, y2: oy + Math.sin(angle) * half, width: Math.max(4, comp.extent * .16) });
          compBelts[comp.id].push(belts.length - 1);
        }
        const basinCount = comp.klass === "continent" ? 2 : 1;
        for (let b = 0; b < basinCount; b += 1) {
          basins.push({
            x: comp.cx + (mapNoiseHash(comp.id + b * 5, 13, seed + 53) - .5) * comp.extent,
            y: comp.cy + (mapNoiseHash(17, comp.id + b * 3, seed + 61) - .5) * comp.extent,
            r: Math.max(6, comp.extent * (.3 + mapNoiseHash(b, comp.id, seed + 67) * .25)),
            amp: .8 + mapNoiseHash(comp.id, b, seed + 71) * .5,
            kind: "basin"
          });
          compBasins[comp.id].push(basins.length - 1);
        }
      });
      const distSeg = (px, py, seg) => {
        const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
        const L = dx * dx + dy * dy || 1;
        const t = mapClamp(((px - seg.x1) * dx + (py - seg.y1) * dy) / L, 0, 1);
        return Math.hypot(px - (seg.x1 + dx * t), py - (seg.y1 + dy * t));
      };
      const rawE = [];
      for (let index = 0; index < labels.length; index += 1) {
        const x = index % cols, y = Math.floor(index / cols);
        const mask = maskArr[index], base = baseArr[index], ridge = ridgeArr[index], detail = detailArr[index], micro = microArr[index];
        const compId = labels[index];
        let belt = 0, basin = 0, klass = "small";
        if (compId >= 0) {
          klass = comps[compId].klass;
          for (const bi of compBelts[compId]) belt = Math.max(belt, Math.exp(-Math.pow(distSeg(x, y, belts[bi]) / belts[bi].width, 2)));
          for (const bi of compBasins[compId]) {
            const bs = basins[bi];
            const g = Math.exp(-Math.pow(Math.hypot(x - bs.x, y - bs.y) / bs.r, 2));
            if (bs.kind === "cone") belt = Math.max(belt, g);
            else basin = Math.min(1, basin + g * bs.amp);
          }
        }
        const interior = mapSmoothstep(.55, .85, mask);
        const plain = interior * (1 - belt) * (1 - mapClamp(basin * 1.2, 0, .8));
        const mountainAmp = klass === "continent" ? .34 : klass === "mid" ? .20 : .14;
        const plainAmp = klass === "continent" ? .20 : klass === "mid" ? .11 : .06;
        const basinAmp = klass === "continent" ? .17 : .09;
        const e = mask * .45
          + belt * mountainAmp * (.5 + ridge * .8)
          + plain * plainAmp * (.55 + base * .6)
          - basin * basinAmp * interior
          + (1 - belt) * (1 - interior) * mask * .14 * ridge
          + detail * .05 + micro * .04;
        rawE.push(e);
      }
      let lo = Infinity, hi = -Infinity;
      rawE.forEach(value => { if (value < lo) lo = value; if (value > hi) hi = value; });
      const norm = rawE.map(value => Math.sqrt(mapClamp((value - lo) / (hi - lo || 1), 0, 1)));
      const sorted = [...norm].sort((a, b) => a - b);
      const coastValue = sorted[Math.floor(sorted.length * .55)];
      const topValue = sorted[sorted.length - 1];
      const scale = .7 / Math.max(.15, topValue - coastValue);
      const elevation = norm.map(value => mapClamp(.3 + (value - coastValue) * scale, 0, 1));
      for (let index = 0; index < elevation.length; index += 1) {
        const x = index % cols, y = Math.floor(index / cols);
        const e = elevation[index];
        const temp = 1 - Math.abs(y / (rows - 1) - .5) * 1.75 - Math.max(0, e - .55) * .95;
        const moisture = moistArr[index];
        if (e < .3) grid.push(0);
        else if (e < .38) grid.push(1);
        else if (e < .425) grid.push(2);
        else if (e > .82 && temp < .45) grid.push(7);
        else if (e > .66) grid.push(6);
        else if (e > .56) grid.push(5);
        else if (moisture > .56 && temp > .34) grid.push(4);
        else if (moisture < .33 && temp > .52) grid.push(2);
        else grid.push(3);
      }
      const rivers = [];
      const candidates = elevation.map((value, index) => ({ index, value, x: index % cols, y: Math.floor(index / cols) })).filter(item => item.value > .6).sort((a, b) => b.value - a.value);
      const stride = Math.max(1, Math.floor(candidates.length / 6));
      for (const source of candidates.filter((item, index) => index % stride === 0).slice(0, 6)) {
        const points = [];
        let x = source.x, y = source.y, current = source.value;
        const visited = new Set();
        for (let step = 0; step < 220; step += 1) {
          const key = y * cols + x;
          if (visited.has(key)) break;
          visited.add(key);
          points.push({ x: x + .5, y: y + .5 });
          if (grid[key] < 2) break;
          let best = null;
          for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
            if (!dx && !dy) continue;
            const tx = x + dx, ty = y + dy;
            if (tx < 1 || ty < 1 || tx >= cols - 1 || ty >= rows - 1) continue;
            const value = elevation[ty * cols + tx];
            if (!best || value < best.value) best = { x: tx, y: ty, value };
          }
          if (!best || best.value > current + .002) break;
          x = best.x; y = best.y; current = best.value;
        }
        if (points.length > 6) rivers.push(points);
      }
      return { seed, cols, rows, grid, elevation, rivers, shape };
    }