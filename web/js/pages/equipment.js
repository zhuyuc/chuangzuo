import { state, weapons } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { aiButton } from "../domain/ai/labels.js";
import { currentWeapon, entityRelationsMarkup, itemOwner, itemOwnerName } from "../domain/entities.js";
import { pageTitle } from "../ui/shell.js";
import { scopeTag } from "./library.js";





/* 龙吟写作 · 装备 */
    export function weaponsPage() {
      const weapon = currentWeapon();
      if (!weapon) return `<section class="page">${pageTitle("装备", "管理武器与防具的能力、代价、持有者和剧情状态。", `<button class="button primary" data-entity-add="item">新增武器/防具</button>`)}<div class="empty-state"><strong>还没有武器或防具</strong><p>创建第一件装备，并关联人物与章节。</p><button class="button primary" data-entity-add="item">新增武器/防具</button></div></section>`;
      const owner = itemOwner(weapon);
      const visibleItems = weapons.filter(item => state.itemCategory === "全部" || item.category === state.itemCategory);
      const itemImage = weapon.image && /^data:image\//.test(weapon.image) ? weapon.image : null;
      return `<section class="page">${pageTitle("装备", "管理武器与防具的能力、代价、持有者和剧情状态。", `<button class="button" data-relationship-from="${weapon.id}">关联装备</button><button class="button primary" data-entity-add="item">新增武器/防具</button>`)}<div class="weapons-layout content-fill"><aside class="inner-sidebar"><div class="search-box">⌕ <input id="item-search" placeholder="搜索武器或防具"></div><div class="scope-tabs" style="margin:0 4px 10px">${["全部", "武器", "防具"].map(category => `<button class="${state.itemCategory === category ? "active" : ""}" data-item-category="${category}">${category}</button>`).join("")}</div><div class="panel-label">${state.itemCategory === "全部" ? "全部装备" : state.itemCategory} · ${visibleItems.length}</div>${visibleItems.map(item => `<button class="weapon-row ${state.weapon === item.id ? "selected" : ""}" data-weapon="${item.id}">${item.image && /^data:image\//.test(item.image) ? `<img class="weapon-thumb" src="${item.image}" alt="">` : ""}<div class="weapon-info"><strong>${item.name}</strong><span>${item.sharedRef ? "共享引用 · " : ""}${item.category} · ${item.kind} · ${itemOwnerName(item)}</span></div><span class="tag">${item.state}</span></button>`).join("")}</aside><div class="weapon-sheet"><div class="weapon-title"><div><div class="eyebrow">${weapon.category} · ${weapon.kind}</div><h2>${weapon.name}</h2></div>${weapon.sharedRef ? scopeTag("shared") : ""}</div><div class="ai-strip">${aiButton("balance", `item:${weapon.id}`)}</div><div class="weapon-visual">${itemImage ? `<img src="${itemImage}" alt="${escapeHtml(weapon.name)}外观">` : '<div class="blade"></div>'}<button class="image-upload-btn" data-item-image>${itemImage ? "更换图片" : "上传图片"}</button><span>外观图片保存在当前作品</span></div><label class="field-label">设定描述</label><p class="detail-copy">${weapon.desc}</p><div class="property-grid"><div><span>装备分类</span><strong>${weapon.category}</strong></div><div><span>具体类型</span><strong>${weapon.kind}</strong></div><div><span>首次出场</span><strong>${weapon.chapter}</strong></div><div><span>当前持有者</span>${owner ? `<button data-character-nav="${owner.id}">${owner.name} →</button>` : `<strong>${weapon.owner}</strong>`}</div></div><label class="field-label">能力与代价</label><div class="ability-row"><strong>${weapon.ability}</strong><span>${weapon.duration}</span><p>${weapon.drawback}</p></div><button class="button" data-entity-edit="item:${weapon.id}">编辑装备设定</button></div><aside class="weapon-history"><div class="panel-label">持有与状态记录</div><div class="timeline"><div><i></i><span>${weapon.chapter}</span><strong>${itemOwnerName(weapon)}开始持有${weapon.name}</strong><p>当前状态为“${weapon.state}”。</p></div><div><i></i><span>更早</span><strong>装备来源</strong><p>来源、历任持有者与关键事件记录在此。</p></div></div><label class="field-label">实体关联</label>${entityRelationsMarkup(weapon.id)}<label class="field-label">关联素材</label><button class="linked-card" data-page="materials"><strong>本作品素材</strong><span>前往素材库查看引用 →</span></button></aside></div></section>`;
    }
