const QUESTION_BANK_URL = "./data/question-bank.v1.json";
const MODEL_CONFIG_URL = "./data/model-config.v1.json";
const ACTIVE_PROFILE = "full";
const RESULT_TOKEN_PREFIX = "ZZTI_PAYLOAD::";
const OPTION_LABELS = ["A", "B", "C", "D"];

let PROFILE_CONFIG = {
  quick: { core: 38, calibration: 0, antiConflict: 0, hidden: 0 },
  standard: { core: 38, calibration: 0, antiConflict: 0, hidden: 0 },
  full: { core: 38, calibration: 0, antiConflict: 0, hidden: 0 },
};
let SCORING_CONFIG = {
  death_weights: { A: 0, B: 0, C: 3, D: 5 },
  action_points: { A: 2, B: 0, C: 3, D: 5 },
  pair_bonus: { DD: 5, CC: 2, CD: 1, DC: 1, CB: 0, BC: 0, DB: 0, BD: 0, BB: 0 },
  strong_hit_threshold: 13,
  medium_hit_threshold: 9,
  clear_trigger: { b_count: 20, d_count: 0, top_score_below: 6 },
  clear_probe_ids: ["Q05", "Q17", "Q37", "Q38"],
  fast_death_streak: 3,
  table_flip_threshold: 10,
};
let PERSONA_LIBRARY = {};
let FORMAL_PERSONAS = [];
let HIDDEN_PERSONA = "人间清醒";
let SIGNAL_METADATA = [];
let SIGNAL_META_MAP = {};

const state = {
  bank: null,
  model: null,
  paper: null,
  currentIndex: 0,
  answers: [],
  paperSeed: null,
};

const dom = {
  startButton: document.getElementById("startButton"),
  homeButton: document.getElementById("homeButton"),
  loadStatus: document.getElementById("loadStatus"),
  landingSection: document.getElementById("landingSection"),
  quizSection: document.getElementById("quizSection"),
  resultSection: document.getElementById("resultSection"),
  questionCounter: document.getElementById("questionCounter"),
  progressFill: document.getElementById("progressFill"),
  brainMeter: document.getElementById("brainMeter"),
  questionStem: document.getElementById("questionStem"),
  optionsContainer: document.getElementById("optionsContainer"),
  prevQuestionButton: document.getElementById("prevQuestionButton"),
  resultTitle: document.getElementById("resultTitle"),
  resultSubtitle: document.getElementById("resultSubtitle"),
  brainlessIndex: document.getElementById("brainlessIndex"),
  brainlessFill: document.getElementById("brainlessFill"),
  brainlessVerdict: document.getElementById("brainlessVerdict"),
  resultVerdict: document.getElementById("resultVerdict"),
  resultConfidence: document.getElementById("resultConfidence"),
  resultStability: document.getElementById("resultStability"),
  resultNeighbor: document.getElementById("resultNeighbor"),
  resultEvidence: document.getElementById("resultEvidence"),
  resultQuote: document.getElementById("resultQuote"),
  dimensionList: document.getElementById("dimensionList"),
  genreTags: document.getElementById("genreTags"),
  roleTags: document.getElementById("roleTags"),
  posterTitle: document.getElementById("posterTitle"),
  posterAnalysis: document.getElementById("posterAnalysis"),
  posterDimensionStrip: document.getElementById("posterDimensionStrip"),
  personaFigureButton: document.getElementById("personaFigureButton"),
  personaFigureImage: document.getElementById("personaFigureImage"),
  personaFigureHint: document.getElementById("personaFigureHint"),
  restartButton: document.getElementById("restartButton"),
  copyButton: document.getElementById("copyButton"),
  posterButton: document.getElementById("posterButton"),
  bridgeNote: document.getElementById("bridgeNote"),
  imageLightbox: document.getElementById("imageLightbox"),
  lightboxBackdrop: document.getElementById("lightboxBackdrop"),
  lightboxClose: document.getElementById("lightboxClose"),
  lightboxImage: document.getElementById("lightboxImage"),
  lightboxCaption: document.getElementById("lightboxCaption"),
};

function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function encodeBase64Url(text) {
  const encoded = btoa(unescape(encodeURIComponent(text)));
  return encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function createPaperSeed() {
  if (window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return buffer[0];
  }
  return Math.floor(Math.random() * 0xffffffff);
}

function cloneQuestion(question) {
  return {
    ...question,
    options: question.options.map((option) => ({ ...option })),
  };
}

function shuffleOptions(question, seed) {
  const options = question.options.map((option) => ({
    ...option,
    original_id: option.original_id || option.id,
  }));
  const rng = mulberry32(hashString(`${seed}:${question.id}:options`));
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }
  return options.map((option, index) => ({
    ...option,
    id: OPTION_LABELS[index],
  }));
}

function buildPaper(profile = "full", seed = createPaperSeed()) {
  const questions = (state.bank?.core_questions || [])
    .slice()
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .map(cloneQuestion)
    .map((question, index) => ({
      ...question,
      options: shuffleOptions(question, seed),
      paper_order: index + 1,
    }));
  return { profile, seed, questions };
}

function getProfileQuestionCount(profile) {
  const config = PROFILE_CONFIG[profile] || PROFILE_CONFIG.full;
  return config.core + config.calibration + config.antiConflict + config.hidden;
}

function updateStartButton() {
  if (!state.bank || !state.model) {
    dom.startButton.disabled = true;
    if (dom.startButton.textContent !== "题库加载失败") {
      dom.startButton.textContent = "题库加载中...";
    }
    return;
  }
  dom.startButton.disabled = false;
  dom.startButton.textContent = `进入前世死法卷 · ${getProfileQuestionCount(ACTIVE_PROFILE)}题`;
}

function showSection(section) {
  dom.landingSection.classList.toggle("is-hidden", section !== "landing");
  dom.quizSection.classList.toggle("is-hidden", section !== "quiz");
  dom.resultSection.classList.toggle("is-hidden", section !== "result");
}

function showLightbox(src, caption) {
  dom.lightboxImage.src = src;
  dom.lightboxCaption.textContent = caption;
  dom.imageLightbox.classList.remove("is-hidden");
  dom.imageLightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-lightbox-open");
}

function hideLightbox() {
  dom.imageLightbox.classList.add("is-hidden");
  dom.imageLightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-lightbox-open");
}

function startTest() {
  state.paperSeed = createPaperSeed();
  state.paper = buildPaper(ACTIVE_PROFILE, state.paperSeed);
  state.answers = [];
  state.currentIndex = 0;
  showSection("quiz");
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderQuestion();
}

function renderQuestion() {
  const question = state.paper.questions[state.currentIndex];
  const total = state.paper.questions.length;
  const progress = ((state.currentIndex + 1) / total) * 100;
  const currentAnswer = state.answers[state.currentIndex];

  dom.questionCounter.textContent = `第 ${state.currentIndex + 1} / ${total} 题`;
  dom.progressFill.style.width = `${progress}%`;
  dom.brainMeter.textContent = `脑子剩余 ${Math.max(0, 100 - Math.round((state.currentIndex / total) * 100))}%`;
  dom.questionStem.innerHTML = `
    <span>${escapeHtml(question.stem)}</span>
    <small style="display:block;margin-top:0.9rem;font-size:0.88rem;line-height:1.7;color:#8c1f16;font-weight:800;">
      ${escapeHtml(question.live_comment || "")}
    </small>
  `;
  dom.prevQuestionButton.disabled = state.currentIndex === 0;

  dom.optionsContainer.innerHTML = "";
  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-card";
    if (currentAnswer && currentAnswer.option.id === option.id) {
      button.classList.add("is-selected");
    }
    button.type = "button";
    button.innerHTML = `<span class="option-key">${option.id}</span><span class="option-text">${escapeHtml(option.text)}</span>`;
    button.addEventListener("click", () => {
      state.answers[state.currentIndex] = { question, option };
      if (state.currentIndex === total - 1) {
        renderResult();
      } else {
        state.currentIndex += 1;
        renderQuestion();
      }
    });
    dom.optionsContainer.appendChild(button);
  });
}

function buildActionCounts() {
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  state.answers.forEach(({ option }) => {
    const level = option.level || option.id || "A";
    counts[level] = (counts[level] || 0) + 1;
  });
  return counts;
}

function buildMaxDStreak() {
  let current = 0;
  let best = 0;
  state.answers.forEach(({ option }) => {
    const level = option.level || option.id || "A";
    if (level === "D") {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
}

function calculateFateScores() {
  const fateScores = Object.fromEntries(FORMAL_PERSONAS.map((name) => [name, 0]));
  const answerLevelMap = {};

  state.answers.forEach(({ question, option }) => {
    const level = option.level || option.id || "A";
    answerLevelMap[question.id] = level;
    Object.entries(option.fate_scores || {}).forEach(([fate, score]) => {
      if (typeof fateScores[fate] === "number") {
        fateScores[fate] += Number(score);
      }
    });
  });

  const pairPatterns = {};
  const pairLevels = {};
  FORMAL_PERSONAS.forEach((name) => {
    const meta = PERSONA_LIBRARY[name];
    const levels = (meta.question_ids || []).map((questionId) => answerLevelMap[questionId] || "A");
    const pattern = levels.join("");
    pairLevels[name] = levels;
    pairPatterns[name] = pattern;
    fateScores[name] += Number(SCORING_CONFIG.pair_bonus[pattern] || 0);
  });

  return { fateScores, pairPatterns, pairLevels };
}

function calculateBrainlessIndex(actionCounts, totalQuestions) {
  const actionPoints = SCORING_CONFIG.action_points;
  const actual = Object.entries(actionCounts).reduce(
    (sum, [level, count]) => sum + count * (actionPoints[level] || 0),
    0,
  );
  const maximum = totalQuestions * Math.max(...Object.values(actionPoints));
  return maximum ? Math.round((actual / maximum) * 100) : 0;
}

function getVerdictLabel(index) {
  if (index < 20) return "人味尚存";
  if (index < 40) return "轻度供梗";
  if (index < 60) return "中度发病";
  if (index < 80) return "重度脑残";
  return "钛合金送头圣体";
}

function getConfidenceLabel(score) {
  if (score < 45) return "边缘命中";
  if (score < 60) return "摇摆命中";
  if (score < 75) return "基本坐实";
  return "高度坐实";
}

function getStabilityLabel(score) {
  if (score < 45) return "左右横跳";
  if (score < 60) return "略有摇摆";
  if (score < 75) return "基本稳定";
  return "稳定成型";
}

function getSignalLevel(name, score) {
  if (name === "clear_rate") {
    if (score < 20) return "基本裸奔";
    if (score < 40) return "偶尔刹车";
    if (score < 60) return "开始留后手";
    if (score < 80) return "暗里收权";
    return "冷脸收网";
  }
  if (name === "flip_rate") {
    if (score < 20) return "桌还在";
    if (score < 40) return "手痒一下";
    if (score < 60) return "随时想掀";
    if (score < 80) return "炸点偏低";
    return "掀桌怪";
  }
  if (name === "hesitate_rate") {
    if (score < 20) return "刹得住";
    if (score < 40) return "偶尔心软";
    if (score < 60) return "慢性送头";
    if (score < 80) return "拖到出事";
    return "观察成瘾";
  }
  if (name === "sacrifice_rate") {
    if (score < 20) return "还能活";
    if (score < 40) return "时有献祭";
    if (score < 60) return "送头成瘾";
    if (score < 80) return "祭品气质";
    return "直接上供";
  }
  if (score < 20) return "轻度复购";
  if (score < 40) return "反复踩坑";
  if (score < 60) return "死局常客";
  if (score < 80) return "回头客";
  return "充值会员";
}

function buildSignalRatings(actionCounts, pairPatterns, totalQuestions) {
  const repeatHits = Object.values(pairPatterns).filter((pattern) => ["CC", "CD", "DC", "DD"].includes(pattern)).length;
  const signalScores = {
    clear_rate: totalQuestions ? Math.round((actionCounts.B / totalQuestions) * 100) : 0,
    sacrifice_rate: totalQuestions ? Math.round((actionCounts.D / totalQuestions) * 100) : 0,
    hesitate_rate: totalQuestions ? Math.round((actionCounts.C / totalQuestions) * 100) : 0,
    flip_rate: totalQuestions ? Math.round((actionCounts.A / totalQuestions) * 100) : 0,
    repeat_rate: FORMAL_PERSONAS.length ? Math.round((repeatHits / FORMAL_PERSONAS.length) * 100) : 0,
  };

  return SIGNAL_METADATA.map((meta) => {
    const score = signalScores[meta.name] || 0;
    return {
      name: meta.name,
      label: meta.label,
      summary: meta.summary,
      score,
      level: getSignalLevel(meta.name, score),
    };
  });
}

function determinePrimaryResult(fateScores, actionCounts) {
  const ranked = Object.entries(fateScores).sort((left, right) => right[1] - left[1]);
  const [topName, topScore] = ranked[0];
  const clearReasons = [];
  const clearTrigger = SCORING_CONFIG.clear_trigger;

  if (actionCounts.B >= clearTrigger.b_count) clearReasons.push("暗里收权成习惯");
  if (actionCounts.D === clearTrigger.d_count) clearReasons.push("从未直接献祭");
  if (topScore < clearTrigger.top_score_below) clearReasons.push("没有任何死法形成强命中");

  return {
    personaName: clearReasons.length && topScore < SCORING_CONFIG.medium_hit_threshold ? HIDDEN_PERSONA : topName,
    clearReasons: clearReasons.length && topScore < SCORING_CONFIG.medium_hit_threshold ? clearReasons : [],
    ranked,
  };
}

function buildConfidence(personaName, rankedFates, pairPatterns, actionCounts) {
  const topScore = rankedFates[0][1];
  const secondScore = rankedFates[1] ? rankedFates[1][1] : 0;
  const gap = Math.max(topScore - secondScore, 0);

  if (personaName === HIDDEN_PERSONA) {
    const score = clamp(
      Math.round(
        55
          + Math.min(actionCounts.B, 24)
          + (actionCounts.D === 0 ? 10 : 0)
          + (topScore < SCORING_CONFIG.clear_trigger.top_score_below ? 10 : 0),
      ),
      55,
      96,
    );
    return { confidenceScore: score, confidenceLabel: getConfidenceLabel(score) };
  }

  const patternBonus = { DD: 16, CC: 8, CD: 3, DC: 3 }[pairPatterns[personaName] || ""] || 0;
  const score = clamp(Math.round(32 + topScore * 3 + gap * 2 + patternBonus), 32, 96);
  return { confidenceScore: score, confidenceLabel: getConfidenceLabel(score) };
}

function buildStability(pairPatterns) {
  let base = 48;
  Object.values(pairPatterns).forEach((pattern) => {
    if (pattern === "BB") base += 3;
    else if (pattern === "DD") base += 4;
    else if (pattern === "CC") base += 2;
    else if (pattern === "CD" || pattern === "DC") base += 1;
    else if (pattern === "AB" || pattern === "BA") base += 2;
    else if (pattern === "AD" || pattern === "DA") base -= 2;
  });
  const score = clamp(Math.round(base), 30, 96);
  return { stabilityScore: score, stabilityLabel: getStabilityLabel(score) };
}

function buildBlendMeta(personaName, rankedFates) {
  const [topName, topScore] = rankedFates[0];
  const second = rankedFates[1] || ["无明显死法", 0];
  const [secondName, secondScore] = second;

  if (personaName === HIDDEN_PERSONA) {
    if (topScore <= 0) {
      return { secondaryPersonaName: "无明显死法", primaryPersonaShare: 100, secondaryPersonaShare: 0, blendLabel: "清醒脱身" };
    }
    const secondaryShare = clamp(Math.round(topScore * 4), 18, 38);
    return {
      secondaryPersonaName: topName,
      primaryPersonaShare: 100 - secondaryShare,
      secondaryPersonaShare: secondaryShare,
      blendLabel: "差点翻车",
    };
  }

  if (secondScore <= 0) {
    return { secondaryPersonaName: "无明显副死法", primaryPersonaShare: 100, secondaryPersonaShare: 0, blendLabel: "单核坐实" };
  }

  const gap = Math.max(topScore - secondScore, 0);
  const secondaryShare = clamp(Math.round(42 - gap * 2), 18, 40);
  return {
    secondaryPersonaName: secondName,
    primaryPersonaShare: 100 - secondaryShare,
    secondaryPersonaShare: secondaryShare,
    blendLabel: secondaryShare >= 30 ? "偏混合" : "单核坐实",
  };
}

function buildAnswerEvidence(personaName, clearReasons) {
  if (personaName === HIDDEN_PERSONA) {
    return state.answers
      .filter(({ option }) => (option.level || option.id) === "B")
      .slice(0, 3)
      .map(({ question, option }) => ({
        questionId: question.id,
        stemExcerpt: truncateText(question.stem),
        optionText: option.text,
        reason: clearReasons[0] || "暗里收权",
      }));
  }

  return state.answers
    .map(({ question, option }) => ({
      questionId: question.id,
      stemExcerpt: truncateText(question.stem),
      optionText: option.text,
      impact: Number((option.fate_scores || {})[personaName] || 0),
      reason: option.level || option.id,
    }))
    .filter((item) => item.impact > 0)
    .sort((left, right) => right.impact - left.impact)
    .slice(0, 3);
}

function truncateText(text, limit = 34) {
  const compact = String(text).replace(/\s+/g, "");
  return compact.length <= limit ? compact : `${compact.slice(0, limit - 1)}…`;
}

function buildEpisodeMeta(personaName, pairPatterns, actionCounts, fastDeath) {
  if (personaName === HIDDEN_PERSONA) {
    return { episodeEstimate: 99, episodeOutcome: "你能活到片尾字幕，代价是编剧嫌你太难骗。" };
  }
  if (fastDeath) {
    return { episodeEstimate: 3, episodeOutcome: "你前世死得特别快，第 3 集就下线了。" };
  }

  const pattern = pairPatterns[personaName] || "AA";
  if (pattern === "DD") return { episodeEstimate: 5, episodeOutcome: "双献祭命中，基本属于开局自带便当。" };
  if (pattern === "CC") return { episodeEstimate: 10, episodeOutcome: "慢性送头，两次都没踩刹车，通常中段开始被埋。" };
  if (pattern === "CD" || pattern === "DC") return { episodeEstimate: 7, episodeOutcome: "一边犹豫一边献祭，死得不算最快，但也绝不算晚。" };
  if (actionCounts.D >= 6) return { episodeEstimate: 6, episodeOutcome: "你整体献祭浓度很高，活不到太后面。" };
  return { episodeEstimate: 12, episodeOutcome: "你不是立刻暴毙型，更像慢慢把自己演进局里的那类人。" };
}

function buildPosterStory(personaMeta, topSignals, brainlessIndex, secondaryPersonaName) {
  const triggerText = topSignals.map((item) => `${item.label}${item.score}`).join(" / ");
  return `${personaMeta.display_name} 这条线最容易被 ${triggerText} 这些信号点燃。扔进 ${personaMeta.genres[0]} 赛道，你大概率会演成 ${personaMeta.roles[0]}。当前脑残指数 ${brainlessIndex}，险些串线的是 ${secondaryPersonaName}。`;
}

function cleanResultComment(text) {
  return String(text || "").replace(/^弹幕锐评[:：]\s*/, "");
}

function getQuoteLine(result) {
  if (result.easterEggs.includes("第3集下线")) {
    return "弹幕锐评：你前世死得特别快，第 3 集就下线了，连回忆杀都没混上。";
  }
  if (result.easterEggs.includes("掀桌怪")) {
    return "弹幕锐评：你不是清醒，你是见局就掀桌，活得快，但也容易先把自己炸出去。";
  }
  return `弹幕锐评：${cleanResultComment(result.personaMeta.result_comment)}`;
}

function buildNeighborSummary(result) {
  if (result.personaName === HIDDEN_PERSONA) {
    if (result.secondaryPersonaShare <= 0 || result.secondaryPersonaName === "无明显死法") {
      return "全线脱身";
    }
    return `差点死成 ${result.secondaryPersonaName} · ${result.secondaryPersonaShare}%`;
  }
  if (result.secondaryPersonaShare <= 0 || /^无明显/.test(result.secondaryPersonaName)) {
    return "没明显串线";
  }
  return `${result.secondaryPersonaName} · ${result.secondaryPersonaShare}%`;
}

function buildEvidenceLine(result) {
  if (result.personaName === HIDDEN_PERSONA) {
    if (result.clearReasons.length) {
      return `刹车痕迹：${result.clearReasons.join(" / ")}`;
    }
    return "刹车痕迹：这轮几乎没给短剧留口子。";
  }
  if (!result.answerEvidence.length) {
    return "送头证据：这轮还没抓到特别稳定的送头证据。";
  }
  return `送头证据：${result.evidenceDigest || "已进入高危死局。"}`;
}

function buildResultTokenPayload(result) {
  return {
    p: result.personaName,
    b: result.brainlessIndex,
    v: result.verdictLabel,
    c: result.confidenceScore,
    s: result.stabilityScore,
    n: result.secondaryPersonaName,
    ps: result.primaryPersonaShare,
    ss: result.secondaryPersonaShare,
    ep: result.episodeEstimate,
    eo: result.episodeOutcome,
    eg: result.easterEggs,
    sig: result.topSignals.map((item) => [item.name, item.score]),
  };
}

function buildPosterCommand(resultToken) {
  return `给 zzti 生结果图：${resultToken}`;
}

function buildShareText(result) {
  return [
    `ZZTI 前世死法：${result.personaName}`,
    `脑残指数：${result.brainlessIndex} / 100 · ${result.verdictLabel}`,
    `死因坐实度：${result.confidenceScore} / 100 · ${result.confidenceLabel}`,
    `送头稳定度：${result.stabilityScore} / 100 · ${result.stabilityLabel}`,
    `险些串线：${buildNeighborSummary(result)}`,
    `高频赛道：${result.personaMeta.genres.join(" / ")}`,
    `常演角色：${result.personaMeta.roles.join(" / ")}`,
    `活到第几集：${result.episodeEstimate === 99 ? "片尾字幕" : `第 ${result.episodeEstimate} 集`}`,
    `翻盘动作：${result.personaMeta.comeback_move}`,
    `判词：${result.personaMeta.verdict}`,
    `弹幕锐评：${cleanResultComment(result.personaMeta.result_comment)}`,
  ].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function renderTags(container, items, className) {
  container.innerHTML = "";
  items.forEach((item, index) => {
    const tag = document.createElement("div");
    tag.className = `tag ${index === items.length - 1 && items.length % 2 === 1 ? "tag-wide" : ""} ${className}`;
    tag.textContent = item;
    container.appendChild(tag);
  });
}

function renderSignalList(signalRatings) {
  dom.dimensionList.innerHTML = "";
  signalRatings.forEach((item) => {
    const card = document.createElement("article");
    card.className = "dimension-item";
    card.innerHTML = `
      <div class="dimension-item-head">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${item.score}</span>
      </div>
      <div class="dimension-item-meta">
        <span>${escapeHtml(item.level)}</span>
        <em>${escapeHtml(item.summary)}</em>
      </div>
      <div class="dimension-track"><div class="dimension-bar" style="width:${item.score}%"></div></div>
    `;
    dom.dimensionList.appendChild(card);
  });
}

function renderAnalysisCards(result) {
  const clearNote = result.clearReasons.length ? `清醒触发：${result.clearReasons.join(" / ")}` : "";
  const cards = [
    { title: "前世死因", text: result.personaMeta.verdict },
    { title: "你在剧里", text: result.personaMeta.result_intro },
    { title: "常演戏码", text: result.personaMeta.result_scene },
    { title: "发病现场", text: result.personaMeta.result_flip },
    { title: "翻盘动作", text: result.personaMeta.comeback_move },
    { title: "能活几集", text: `${result.episodeEstimate === 99 ? "片尾字幕" : `第 ${result.episodeEstimate} 集`}。${result.episodeOutcome} ${result.personaMeta.result_ending}`.trim() },
  ];

  if (clearNote) {
    cards.push({ title: "刹车痕迹", text: clearNote });
  }
  if (result.easterEggs.length) {
    cards.push({ title: "彩蛋判词", text: result.easterEggs.join(" / ") });
  }

  dom.posterAnalysis.innerHTML = cards
    .map(
      (item) => `
        <article class="analysis-card">
          <span class="analysis-card-title">${escapeHtml(item.title)}</span>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `,
    )
    .join("");
}

function renderSignalStrip(topSignals) {
  dom.posterDimensionStrip.innerHTML = topSignals
    .map((item) => `<span class="poster-dimension-chip">${escapeHtml(item.label)} ${item.score}</span>`)
    .join("");
}

function buildResult() {
  const totalQuestions = state.answers.length;
  const actionCounts = buildActionCounts();
  const maxDStreak = buildMaxDStreak();
  const { fateScores, pairPatterns, pairLevels } = calculateFateScores();
  const { personaName, clearReasons, ranked } = determinePrimaryResult(fateScores, actionCounts);
  const personaMeta = PERSONA_LIBRARY[personaName];
  const signalRatings = buildSignalRatings(actionCounts, pairPatterns, totalQuestions);
  const topSignals = signalRatings.slice().sort((left, right) => right.score - left.score).slice(0, 4);
  const brainlessIndex = calculateBrainlessIndex(actionCounts, totalQuestions);
  const verdictLabel = getVerdictLabel(brainlessIndex);
  const { confidenceScore, confidenceLabel } = buildConfidence(personaName, ranked, pairPatterns, actionCounts);
  const { stabilityScore, stabilityLabel } = buildStability(pairPatterns);
  const blendMeta = buildBlendMeta(personaName, ranked);
  const answerEvidence = buildAnswerEvidence(personaName, clearReasons);
  const fastDeath = maxDStreak >= SCORING_CONFIG.fast_death_streak;
  const { episodeEstimate, episodeOutcome } = buildEpisodeMeta(personaName, pairPatterns, actionCounts, fastDeath);
  const easterEggs = [];
  if (fastDeath) easterEggs.push("第3集下线");
  if (actionCounts.A >= SCORING_CONFIG.table_flip_threshold) easterEggs.push("掀桌怪");

  const result = {
    personaName,
    personaMeta,
    brainlessIndex,
    verdictLabel,
    confidenceScore,
    confidenceLabel,
    stabilityScore,
    stabilityLabel,
    actionCounts,
    fateScores,
    pairPatterns,
    pairLevels,
    clearReasons,
    signalRatings,
    topSignals,
    answerEvidence,
    evidenceDigest: answerEvidence.map((item) => `${item.questionId}：${item.stemExcerpt}`).join(" / "),
    episodeEstimate,
    episodeOutcome,
    easterEggs,
    posterStory: buildPosterStory(personaMeta, topSignals.slice(0, 3), brainlessIndex, blendMeta.secondaryPersonaName),
    ...blendMeta,
  };

  const tokenPayload = buildResultTokenPayload(result);
  const resultToken = `${RESULT_TOKEN_PREFIX}${encodeBase64Url(JSON.stringify(tokenPayload))}`;
  result.resultToken = resultToken;
  result.posterCommand = buildPosterCommand(resultToken);
  return result;
}

function renderResult() {
  const result = buildResult();
  const personaAsset = result.personaMeta.asset || "./assets/deco-art.svg";
  const personaCaption = `${result.personaName} · ${cleanResultComment(result.personaMeta.result_comment)}`;

  dom.resultTitle.textContent = `你前世死成了【${result.personaName}】`;
  dom.resultSubtitle.textContent = result.personaMeta.tagline;
  dom.posterTitle.textContent = result.personaName;
  renderAnalysisCards(result);
  renderSignalStrip(result.topSignals);

  dom.brainlessIndex.textContent = String(result.brainlessIndex);
  dom.brainlessFill.style.width = `${result.brainlessIndex}%`;
  dom.brainlessVerdict.textContent = `${result.verdictLabel} · ${result.personaMeta.tagline}`;

  dom.resultVerdict.textContent = result.personaMeta.verdict;
  dom.resultConfidence.textContent = `${result.confidenceScore} / 100 · ${result.confidenceLabel}`;
  dom.resultStability.textContent = `${result.stabilityScore} / 100 · ${result.stabilityLabel}`;
  dom.resultNeighbor.textContent = buildNeighborSummary(result);
  dom.resultEvidence.textContent = buildEvidenceLine(result);
  dom.resultQuote.textContent = getQuoteLine(result);

  dom.personaFigureImage.src = personaAsset;
  dom.personaFigureImage.alt = `${result.personaName} 角色形象图`;
  dom.personaFigureHint.textContent = `点击放大 ${result.personaName} 角色形象`;
  dom.personaFigureImage.onerror = () => {
    dom.personaFigureImage.onerror = null;
    dom.personaFigureImage.src = "./assets/deco-art.svg";
    dom.personaFigureHint.textContent = `${result.personaName} 角色图待补`;
  };
  dom.personaFigureButton.onclick = () => showLightbox(dom.personaFigureImage.currentSrc || dom.personaFigureImage.src, personaCaption);

  renderSignalList(result.signalRatings);
  renderTags(dom.genreTags, result.personaMeta.genres, "genre");
  renderTags(dom.roleTags, result.personaMeta.roles, "role");

  dom.restartButton.onclick = startTest;
  dom.copyButton.onclick = async () => {
    await copyText(buildShareText(result));
    dom.bridgeNote.textContent = "结果摘要已复制。";
  };
  dom.posterButton.onclick = async () => {
    await copyText(result.posterCommand);
    dom.bridgeNote.textContent = "回飞书出图口令已复制，切回飞书直接发给 OpenClaw。";
  };

  showSection("result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadResources() {
  const [bankResp, modelResp] = await Promise.all([fetch(QUESTION_BANK_URL), fetch(MODEL_CONFIG_URL)]);
  if (!bankResp.ok || !modelResp.ok) {
    throw new Error("题库或模型配置加载失败");
  }
  const [bank, model] = await Promise.all([bankResp.json(), modelResp.json()]);
  state.bank = bank;
  state.model = model;
  PROFILE_CONFIG = model.profile_config || PROFILE_CONFIG;
  SCORING_CONFIG = model.scoring || SCORING_CONFIG;
  PERSONA_LIBRARY = model.persona_library || {};
  FORMAL_PERSONAS = model.formal_personas || [];
  HIDDEN_PERSONA = model.hidden_persona || HIDDEN_PERSONA;
  SIGNAL_METADATA = model.signal_metadata || [];
  SIGNAL_META_MAP = Object.fromEntries(SIGNAL_METADATA.map((item) => [item.name, item]));
  updateStartButton();
}

function bindStaticEvents() {
  dom.startButton.addEventListener("click", startTest);
  dom.homeButton.addEventListener("click", () => {
    showSection("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  dom.prevQuestionButton.addEventListener("click", () => {
    if (state.currentIndex <= 0) return;
    state.currentIndex -= 1;
    renderQuestion();
  });
  dom.lightboxBackdrop.addEventListener("click", hideLightbox);
  dom.lightboxClose.addEventListener("click", hideLightbox);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.imageLightbox.classList.contains("is-hidden")) {
      hideLightbox();
    }
  });
}

async function main() {
  bindStaticEvents();
  try {
    await loadResources();
    dom.loadStatus.classList.add("is-hidden");
  } catch (error) {
    dom.loadStatus.classList.remove("is-hidden");
    dom.loadStatus.textContent = `加载失败：${error.message}`;
    dom.startButton.disabled = true;
    dom.startButton.textContent = "题库加载失败";
  }
}

main();
