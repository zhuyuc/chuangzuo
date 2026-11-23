function blankRefs() {
  return {
    characterIds: [], placeIds: [], itemIds: [], worldEntryIds: [], materialIds: [],
    detectedCharacterIds: [], detectedPlaceIds: [], detectedItemIds: [], detectedWorldIds: [],
    suppressedCharacterIds: [], suppressedPlaceIds: [], suppressedItemIds: [], suppressedWorldIds: []
  };
}

function buildDemoPayload() {
  const c1 = "demo-c1", c2 = "demo-c2", c3 = "demo-c3";
  const chapters = [
    { id: c1, title: "第一章 雨夜归人", volume: "第一卷 风起", volumeId: "v1", state: "已完成", words: "86", summary: "沈昭雨夜返回临山城，旧腰牌迫使守门卒开门。", beats: ["雨夜抵达", "腰牌暴露"], ...blankRefs(), characterIds: ["shen", "ah"], placeIds: ["p-city"], itemIds: ["w-sword"], materialIds: [] },
    { id: c2, title: "第二章 旧城灯火", volume: "第一卷 风起", volumeId: "v1", state: "已完成", words: "74", summary: "药铺重逢，旧城现状显露旧案痕迹。", beats: ["药铺重逢"], ...blankRefs(), characterIds: ["shen", "ah"], placeIds: ["p-city"], itemIds: [], materialIds: ["m1"] },
    { id: c3, title: "第三章 无名的信", volume: "第一卷 风起", volumeId: "v1", state: "写作中", words: "98", summary: "无署名信件出现，师徒关系开始裂缝。", beats: ["雨夜收信", "拔刀读信"], ...blankRefs(), characterIds: ["shen", "luo"], placeIds: ["p-workshop"], itemIds: ["w-sword", "w-bow"], materialIds: ["m2"] }
  ];
  const text = {
    [c1]: "雨落在临山城的城砖上，声音很闷。\n\n沈昭把旧腰牌递过去，守门卒看了一眼，手就抖了。\n\n阿禾在药铺门口等他，灯笼照着她半张脸。",
    [c2]: "药铺里全是捣药的声音。\n\n阿禾没有抬头，只把一味药推到他手边：「你走后，城里改了三条规矩。」\n\n沈昭看着窗外灯火，没有说话。",
    [c3]: "那封信没有署名。\n\n信封上只画了一道断开的河流，墨色很新。\n\n罗惟坐在对面，将照夜弩的机括一件件摆在桌上：「你回来以后，城里已经有三个人睡不着了。」\n\n沈昭拔出断水，刀光照见信纸上第一行字：不要相信你师父。"
  };
  const work = {
    id: "work-demo", name: "长夜燃灯", current: "第一卷 · 第三章 无名的信", words: "258 字", time: "刚刚", progress: 1, form: "长篇", genre: "奇幻",
    data: {
      chapters, materials: [
        { id: "m1", title: "古代城池的坊市布局", type: "网页剪藏", source: "《中国古代城市研究》", sourceUrl: "", tags: ["城建", "临山城"], updated: "今天 10:24", note: "东西市空间参考，重点关注宵禁后的更夫路线。" },
        { id: "m2", title: "雨水对火药保存的影响", type: "资料笔记", source: "手动整理", sourceUrl: "", tags: ["武器", "气候"], updated: "昨天 21:08", note: "用于解释第三章火器失灵的原因。" }
      ],
      characters: [
        { id: "shen", name: "沈昭", alias: "", role: "主角 · 前巡城卫", faction: "巡城司", location: "临山城", goal: "查明三年前旧案真相，同时保护阿禾。", weakness: "无法拒绝熟悉口音的人", ability: "断水刀法", abilityCost: "经脉旧伤", background: "三年前旧案后离开临山城。", color: "blue", secrets: [{ id: "sec1", text: "旧案当夜他到过现场，并拿走了一份名单。", threat: 5, isPublic: false, knownByIds: ["peijing"], suspectedByIds: ["xie"] }] },
        { id: "peijing", name: "裴景", alias: "", role: "师父 · 山门弃徒", faction: "", location: "青梧山", goal: "保护青梧山与旧案最后一份证据。", weakness: "", ability: "", abilityCost: "", background: "沈昭的师父。", color: "purple", secrets: [] },
        { id: "luo", name: "罗惟", alias: "", role: "盟友 · 神机营造匠", faction: "", location: "临山城", goal: "查清照夜弩被人改动的目的。", weakness: "", ability: "", abilityCost: "", background: "在西市经营工坊。", color: "green", secrets: [] },
        { id: "ah", name: "阿禾", alias: "", role: "妹妹 · 药铺学徒", faction: "", location: "临山城", goal: "守住药铺与哥哥。", weakness: "", ability: "", abilityCost: "", background: "", color: "pink", secrets: [] },
        { id: "xie", name: "谢阑", alias: "", role: "对手 · 城门校尉", faction: "巡城司", location: "临山城", goal: "封住旧案继续扩散。", weakness: "", ability: "", abilityCost: "", background: "", color: "orange", secrets: [] }
      ],
      relationships: [
        { id: "r1", from: "shen", to: "peijing", type: "师徒", scope: "work", stage: "第二卷 · 惊澜", state: "出现裂痕", note: "无署名信件让沈昭开始怀疑裴景。", source: "第三章 无名的信" },
        { id: "r2", from: "shen", to: "ah", type: "兄妹", scope: "work", stage: "长期事实", state: "亲属", note: "", source: "共享人物档案" },
        { id: "r3", from: "we-xuncheng", to: "xie", type: "统属", scope: "work", stage: "第一卷 · 风起", state: "暗中失控", note: "谢阑借调令掩盖旧案清理。", source: "巡城司设定" }
      ],
      items: [
        { id: "w-sword", name: "断水", alias: "", category: "武器", kind: "横刀", owner: "沈昭", ownerId: "shen", state: "已认主", chapter: "第一章 雨夜归人", ability: "截断气机", duration: "三息", drawback: "每次使用加深经脉损伤。", desc: "刀身狭长，旧铭被磨去。" },
        { id: "w-bow", name: "照夜", alias: "", category: "武器", kind: "手弩", owner: "罗惟", ownerId: "luo", state: "改造中", chapter: "第二章 旧城灯火", ability: "三矢连发", duration: "装填一次", drawback: "雨天机括容易卡死。", desc: "神机营制式手弩改造版。" }
      ],
      places: [
        { id: "p-city", name: "临山城", alias: "旧城", type: "城池 · 山南道", parentId: "", terrain: "", climate: "", powers: "巡城司", danger: "", x: 390, y: 250, desc: "故事起点，河道贯穿东西两市。" },
        { id: "p-mountain", name: "青梧山", alias: "", type: "山门 · 北岭", parentId: "", terrain: "", climate: "", powers: "", danger: "", x: 210, y: 120, desc: "裴景曾经所属的山门。" },
        { id: "p-workshop", name: "罗惟工坊", alias: "", type: "城内地点 · 西市", parentId: "p-city", terrain: "", climate: "", powers: "", danger: "", x: 445, y: 290, desc: "无署名信件出现的位置。" }
      ],
      worldEntries: [
        { id: "we-xuncheng", entityType: "faction", name: "巡城司", alias: "", summary: "掌管城门、宵禁与巡防的官方机构。", fields: { kind: "军政机构", leader: "谢阑", goal: "维持秩序并封住旧案。", resource: "城门守卫与调令", weakness: "内部已被旧案渗透。" }, body: "", updated: "刚刚" },
        { id: "we-oldcase", entityType: "event", name: "临山城旧案", alias: "", summary: "三年前震动全城的灭门案。", fields: { era: "长历七九三年", year: "793", importance: "5", cause: "一份涉及山门的名单流出", impact: "沈昭被逐，沈家覆灭。" }, body: "", updated: "刚刚" },
        { id: "we-qi", entityType: "rule", name: "气机反噬", alias: "", summary: "越阶运功会产生暗伤。", fields: { domain: "武学", law: "气机沿经脉运行方可强化身体。", cost: "越阶运功造成不可逆损伤。", exception: "断水可截断一小段反噬。", status: "稳定" }, body: "", updated: "刚刚" }
      ],
      worldOverview: { genre: "奇幻", intro: "长历八百年，山南道一城群山。武学与气机流转其间，常人—武士—宗师—化境。被朝廷抹去的旧案与临山城秩序的对立，正撕裂这个世界；一个人的旧案，正在撬动整座临山城的权力根基。" },
      inspirations: [
        { id: "insp1", text: "旧腰牌背面也许还刻着第二个人的名字。", category: "情节线索", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: "insp2", text: "阿禾每次捣药都会刻意避开某种药材。", category: "人物细节", createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() }
      ],
      recentRefIds: ["shen", "w-sword", "p-city"],
      history: [],
      openTabs: [c1, c2, c3],
      currentChapter: c3,
      outline: {
        worldRules: "气机源于山河共鸣，破一地共鸣者必受其反噬；朝廷法度与江湖旧案分别在临山城明暗两面运行。",
        worldTerrain: "山南道一城群山：北有青梧山寒峻，南有河谷湿雾，中部盆地坐落临山城，驿道与季节河贯穿其间。",
        volumes: [
          { id: "v1", title: "第一卷", subtitle: "风起", goal: "旧案信物出现，主要人物登场。", target: 320000 },
          { id: "v2", title: "第二卷", subtitle: "惊澜", goal: "师徒关系出现不可逆裂痕。", target: 460000 }
        ]
      },
      maps: [{ id: "map-demo", name: "世界地图", kind: "世界", worldMap: null, image: null, view: { zoom: 1, panX: 0, panY: 0 } }], text
    }
  };
  return {
    library: [
      { id: "lib-shen", kind: "人物", name: "沈昭", scope: "shared", usage: "当前账户", summary: "前巡城卫，阿禾的兄长。", base: "姓名、出身与共享亲属关系。", extension: "作品内身份与剧情经历分别保存。" },
      { id: "lib-city", kind: "地点", name: "临山城", scope: "shared", usage: "当前账户", summary: "山南道旧城。", base: "地理位置与城区结构。", extension: "势力范围与路线按作品保存。" }
    ],
    works: [work]
  };
}

function buildBlankWork(workId, name) {
  const chapterId = `${workId}-c1`;
  const chapter = { id: chapterId, title: "第一章 未命名章节", volume: "第一卷", volumeId: "v1", state: "待写作", words: "0", summary: "", beats: [], ...blankRefs() };
  return {
    id: workId, name, current: "第一卷 · 第一章 未命名章节", words: "0 字", time: "刚刚", progress: 0, form: "长篇", genre: "奇幻",
    data: {
      chapters: [chapter], materials: [], characters: [], relationships: [], items: [], places: [], worldEntries: [],
      worldOverview: { genre: "", intro: "" },
      inspirations: [], recentRefIds: [], history: [], openTabs: [chapterId], currentChapter: chapterId,
      outline: { premise: "", conflict: "", goal: "", ending: "", volumes: [{ id: "v1", title: "第一卷", subtitle: "未命名卷", goal: "", target: 100000 }] },
      maps: [{ id: `map-${workId}`, name: "世界地图", kind: "世界", worldMap: null, image: null, view: { zoom: 1, panX: 0, panY: 0 } }], text: { [chapterId]: "" }
    }
  };
}

module.exports = { buildDemoPayload, buildBlankWork, blankRefs };
