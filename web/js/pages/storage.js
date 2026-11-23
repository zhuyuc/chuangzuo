import { chapters, state, works } from "../core/store.js";
import { activeWork } from "../domain/works.js";
import { pageTitle } from "../ui/shell.js";





/* 龙吟写作 · 服务器与备份页 */
    export function storagePage() {
      const totalFiles = works.reduce((sum, work) => sum + work.data.chapters.length + 1, 0);
      return `<section class="page padded">
        ${pageTitle("服务器与备份", "备份当前账户的全部作品、共享设定和正文；也可以单独导出正在写的作品。", `<button class="button" data-export-work>导出当前作品</button><button class="button primary" data-backup-all>立即备份</button>`)}
        <div class="backup-actions">
          <div class="backup-card"><h2>账户备份</h2><p>包含所有作品、世界观、地图、素材与正文，可从这里完整恢复。</p><span class="status">上次备份：${state.lastBackup}</span><button class="button primary" data-backup-all>生成备份文件</button></div>
          <div class="backup-card"><h2>导出当前作品</h2><p>将《${activeWork().name}》导出为 Markdown，包含卷章、正文与大纲摘要。</p><span class="status">${chapters.length} 章 · ${totalFiles} 个结构文件</span><button class="button" data-export-work>导出 Markdown</button></div>
          <div class="backup-card"><h2>从备份恢复</h2><p>选择由龙吟写作生成的账户备份文件，恢复作品与共享设定。</p><span class="status">恢复会覆盖当前账户的全部作品与共享设定</span><label class="button" style="text-align:center">选择备份文件<input class="backup-file" id="backup-file" type="file" accept=".json,application/json"></label></div>
        </div>
        <details class="schema-panel" style="margin-top:0"><summary>查看账户数据结构与写入规则</summary><div class="storage-grid" style="margin-top:16px">
          <div class="storage-tree-panel"><div class="section-heading"><h2>账户数据结构</h2><span class="tag">龙吟文库</span></div><pre>龙吟文库/
├─ account.json                账户与备份版本
├─ library/                    账户共享设定
├─ works/
│  ├─ ${activeWork().name}.lywork/
│  │  ├─ project.json
│  │  ├─ outline.json
│  │  ├─ chapters/*.md
│  │  ├─ characters/
│  │  ├─ relations/
│  │  ├─ places/
│  │  ├─ items/
│  │  ├─ world/                    势力、种族、事件、规则
│  │  ├─ materials/
│  │  └─ history/
│  └─ 其他作品...
└─ backups/                    独立备份，不作为数据源</pre></div>
          <div class="storage-rules">
            <div class="rule-block"><span>01</span><div><h2>账户即数据边界</h2><p>备份包含当前账户下的全部作品和共享设定，不包含其他账户的数据。</p></div></div>
            <div class="rule-block"><span>02</span><div><h2>正文与结构可迁移</h2><p>正文以 Markdown 导出，作品设定随账户备份保存，便于长期保存与迁移。</p></div></div>
            <div class="rule-block"><span>03</span><div><h2>恢复前保留当前状态</h2><p>恢复备份会覆盖当前数据；正式版本应在恢复前自动创建一份安全备份。</p></div></div>
            <div class="rule-block"><span>04</span><div><h2>失败不会破坏现有文件</h2><p>正式写入前校验备份格式，写入临时文件后再原子替换。</p></div></div>
          </div>
        </div></details>
      </section>`;
    }
