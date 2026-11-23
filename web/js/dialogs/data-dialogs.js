import { characters, historySnapshots, inspirations, state, works } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { currentChapter, currentCharacter, storyEntityById } from "../domain/entities.js";
import { inspirationRichHtml } from "../domain/rich-text.js";
import { activeData } from "../domain/works.js";
import { countRefMentions } from "../domain/writing/references.js";
import { workFormMarkup } from "./entity-dialog.js";





/* 龙吟写作 · 数据类弹窗内容 */
    export function renderInspirationDialog(root) {
        const item = state.inspirationEditId ? inspirations.find(entry => entry.id === state.inspirationEditId) : null;
        const categories = [...new Set(inspirations.map(entry => String(entry.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
        const richButton = (command, label, glyph) => `<button type="button" data-rich-command="${command}" title="${label}" aria-label="${label}">${glyph}</button>`;
        const toolbar = `${richButton("bold", "加粗", "<strong>B</strong>")}${richButton("italic", "斜体", "<em>I</em>")}${richButton("underline", "下划线", "<u>U</u>")}${richButton("strikeThrough", "删除线", "<s>S</s>")}<span class="rich-sep"></span>${richButton("insertUnorderedList", "无序列表", "•")}${richButton("insertOrderedList", "有序列表", "1.")}${richButton("quote", "引用", "❝")}`;
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card"><div class="dialog-header"><div><h1>${item ? "编辑灵感" : "新增灵感"}</h1><p>${item ? "保留原始念头，也可以调整分类。" : "记下一句话、一个画面或一个反转，只保存在当前作品。"}</p></div><button class="dialog-close" data-dialog-close>×</button></div><form id="inspiration-form" novalidate><div class="dialog-body"><div class="form-field"><label for="inspiration-edit-category">分类</label><select class="dialog-select" id="inspiration-edit-category" name="categorySelect"><option value="">未分类</option>${categories.map(category => `<option value="${escapeHtml(category)}" ${item?.category === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}<option value="__new">＋ 新建分类</option></select></div><div class="form-field" id="inspiration-new-category-field" hidden><label for="inspiration-edit-category-new">新分类名称</label><input class="auth-input" id="inspiration-edit-category-new" name="categoryNew" maxlength="30" placeholder="输入一个新的分类名称"><div class="field-error" data-error-for="category"></div></div><div class="form-field"><label id="inspiration-edit-text-label" data-rich-focus>灵感内容</label><div class="rich-editor" data-rich-editor><div class="rich-toolbar" role="toolbar" aria-label="灵感格式">${toolbar}</div><div class="rich-input" id="inspiration-edit-text" data-rich-input contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="inspiration-edit-text-label" data-placeholder="刚才想到的那个画面、那句对白、那个还没想清楚的反转……">${inspirationRichHtml(item)}</div></div><div class="field-error" data-error-for="text"></div></div></div><div class="dialog-actions"><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">${item ? "保存修改" : "创建"}</button></div></form></section></div>`;
    }

    export function renderRemoveRefDialog(root) {
        const [type, ...idParts] = String(state.removeRefKey || "").split(":");
        const entity = storyEntityById(idParts.join(":"));
        const chapter = currentChapter();
        if (!entity || !chapter) { state.dialog = null; root.innerHTML = ""; return; }
        const mentions = countRefMentions(chapter, entity);
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card dialog-sm"><div class="dialog-header"><div><h1>移除「${escapeHtml(entity.name)}」的本章引用？</h1><p>移除只影响本章的资料关联与出场统计，不会改动正文。</p></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body"><p class="detail-copy">${mentions ? `正文中仍出现 ${mentions} 处「${escapeHtml(entity.name)}」或其别名。若一并删除，句子可能不完整，需要自行检查正文。` : "正文中没有出现该名称，移除后本章将不再引用它。"}</p></div><div class="dialog-actions"><button class="button" data-dialog-close>取消</button><button class="button" data-remove-ref="link">仅解除关联</button>${mentions ? `<button class="button primary" data-remove-ref="text">解除并删除正文 ${mentions} 处</button>` : ""}</div></section></div>`;
    }

    export function renderWorkSwitchDialog(root) {
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card"><div class="dialog-header"><div><h1>切换作品</h1><p>选择后返回工作台，大纲、设定和正文会一起切换。</p></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body"><div class="account-list">${works.map(work => `<button class="work-switch-row ${work.id === state.currentWork ? "selected" : ""}" data-switch-work="${work.id}"><span class="book-spine">${work.name.slice(0, 1)}</span><span><strong>${work.name}</strong><small>${work.current} · ${work.words}</small></span><b>${work.id === state.currentWork ? "当前" : "切换"}</b></button>`).join("")}</div></div><div class="dialog-actions"><button class="button" data-home>返回工作台</button></div></section></div>`;
    }

    export function renderHistoryDialog(root) {
        const chapterHistory = historySnapshots.filter(item => item.chapterId === state.chapter);
        const snapshot = chapterHistory.find(item => item.id === state.historyVersion) || chapterHistory[0];
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card history-dialog dialog-xl"><div class="dialog-header"><div><h1>历史版本</h1><p>${currentChapter().title} · 选择快照预览后恢复</p></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body">${snapshot ? `<div class="history-grid"><div class="history-list">${chapterHistory.map(item => `<button class="history-item ${snapshot.id === item.id ? "selected" : ""}" data-history-version="${item.id}"><strong>${item.time}</strong><span>${item.words} · ${item.summary}</span></button>`).join("")}</div><div class="history-preview"><h2>${snapshot.summary}</h2><span>${snapshot.time} · ${snapshot.words}</span><pre>${escapeHtml(snapshot.text)}</pre></div></div>` : '<div class="empty-state compact"><strong>还没有历史版本</strong><p>继续写作后，系统会在这里保留可恢复的快照。</p></div>'}</div><div class="dialog-actions"><button class="button" data-dialog-close>取消</button>${snapshot ? '<button class="button primary" data-history-restore>恢复此版本</button>' : ""}</div></section></div>`;
    }

    export function renderSecretDialog(root) {
        const person = currentCharacter();
        const secret = (person.secrets || []).find(item => item.id === state.secretId);
        const threats = ["微不足道", "有点麻烦", "会改变关系", "足以毁掉一个人", "会引发战争"];
        const others = characters.filter(item => item.id !== person.id);
        const checkboxGroup = (title, name, selected) => `<div class="secret-group"><label class="secret-group-label">${title}</label>${others.map(item => `<label><input type="checkbox" name="${name}" value="${item.id}" ${selected.includes(item.id) ? "checked" : ""}>${escapeHtml(item.name)}</label>`).join("") || '<span class="muted">暂无其他人物</span>'}</div>`;
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card"><div class="dialog-header"><div><h1>${secret ? "编辑秘密" : "添加秘密"}</h1><p>秘密的价值不在内容本身，而在谁知道、谁在怀疑。</p></div><button class="dialog-close" data-dialog-close>×</button></div><form id="secret-form" novalidate><div class="dialog-body"><div class="form-field"><label for="secret-text">秘密内容</label><textarea class="auth-input textarea-sm" id="secret-text" name="text" placeholder="这个人物不能让谁知道的事">${escapeHtml(secret?.text || "")}</textarea><div class="field-error" data-error-for="text"></div></div><div class="secret-group"><label>威胁程度</label><select class="dialog-select" name="threat">${threats.map((label, index) => `<option value="${index + 1}" ${Number(secret?.threat || 3) === index + 1 ? "selected" : ""}>${index + 1} · ${label}</option>`).join("")}</select></div><div class="secret-group"><label><input type="checkbox" name="isPublic" ${secret?.isPublic ? "checked" : ""}> 已经公开</label></div>${checkboxGroup("知情者", "knownBy", secret?.knownByIds || [])}${checkboxGroup("怀疑者", "suspectedBy", secret?.suspectedByIds || [])}</div><div class="dialog-actions"><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">保存秘密</button></div></form></section></div>`;
    }

    export function renderNewMapDialog(root) {
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card"><div class="dialog-header"><div><h1>新建地图</h1><p>同一部作品可以拥有多张地图：世界、区域、城池各成一张。</p></div><button class="dialog-close" data-dialog-close>×</button></div><form id="new-map-form" novalidate><div class="dialog-body"><div class="form-field"><label for="new-map-name">地图名称</label><input class="auth-input" id="new-map-name" name="mapName" placeholder="如：北境 / 临山城" autofocus><div class="field-error" data-map-error></div></div><div class="form-field"><label for="new-map-kind">地图层级</label><select class="dialog-select" id="new-map-kind" name="kind"><option>世界</option><option>区域</option><option>城池</option></select></div><div class="form-field"><label for="new-map-source">地形来源</label><select class="dialog-select" id="new-map-source" name="source"><option value="generate">立即随机生成</option><option value="blank">空白海图（用笔刷画陆）</option><option value="copy">复制当前地图地形</option></select></div></div><div class="dialog-actions"><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">创建并打开</button></div></form></section></div>`;
    }

    export function renderRenameMapDialog(root) {
        const targetMap = (activeData()?.maps || []).find(item => item.id === state.renameMapId);
        if (!targetMap) { root.innerHTML = ""; return; }
        root.innerHTML = `<div class="dialog-screen"><section class="dialog-card"><div class="dialog-header"><div><h1>重命名地图</h1><p>改名后地图册与地点详情会同步显示新名称。</p></div><button class="dialog-close" data-dialog-close>×</button></div><form id="rename-map-form" novalidate><div class="dialog-body"><div class="form-field"><label for="rename-map-name">地图名称</label><input class="auth-input" id="rename-map-name" name="mapName" value="${escapeHtml(targetMap.name)}" autofocus><div class="field-error" data-map-error></div></div></div><div class="dialog-actions"><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">保存</button></div></form></section></div>`;
    }

    export function renderEditWorkDialog(root) {
        const target = works.find(item => item.id === state.workEditId);
        if (!target) { root.innerHTML = ""; return; }
        root.innerHTML = workFormMarkup(target);
    }
