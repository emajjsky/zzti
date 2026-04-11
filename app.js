const QUESTION_BANK_URL = "./data/question-bank.v1.json";
const MODEL_CONFIG_URL = "./data/model-config.v1.json";
const ACTIVE_PROFILE = "full";
const RESULT_TOKEN_PREFIX = "ZZTI_PAYLOAD::";

let PROFILE_CONFIG = {
  quick: { core: 50, calibration: 0, antiConflict: 0, hidden: 0 },
  standard: { core: 50, calibration: 0, antiConflict: 0, hidden: 0 },
  full: { core: 50, calibration: 0, antiConflict: 0, hidden: 0 },
};

let DIMENSION_ORDER = [];
let DIMENSION_METADATA = [];
let DIMENSION_META_MAP = {};
let BRAINLESS_WEIGHTS = {};
let PERSONA_LIBRARY = {};

const state = {
  bank: null,
  model: null,
  paper: null,
  currentIndex: 0,
  answers: [],
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
  questionStoryline: document.getElementById("questionStoryline"),
  optionsContainer: document.getElementById("optionsContainer"),
  resultTitle: document.getElementById("resultTitle"),
  resultSubtitle: document.getElementById("resultSubtitle"),
  brainlessIndex: document.getElementById("brainlessIndex"),
  brainlessFill: document.getElementById("brainlessFill"),
  brainlessVerdict: document.getElementById("brainlessVerdict"),
  resultVerdict: document.getElementById("resultVerdict"),
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

function chooseCore(coreQuestions, count) {
  return coreQuestions
    .slice()
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .slice(0, count);
}

function buildPaper(profile = "standard") {
  const coreQuestions = state.bank.core_questions || [];
  const selectedCore = chooseCore(coreQuestions, coreQuestions.length);
  return {
    profile,
    questions: selectedCore,
  };
}

function getProfileQuestionCount(profile) {
  const config = PROFILE_CONFIG[profile];
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
  dom.startButton.textContent = `进入固定发疯卷 · ${getProfileQuestionCount(ACTIVE_PROFILE)}题`;
}

function getQuestionTypeLabel(question) {
  return "固定卷";
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
  state.paper = buildPaper(ACTIVE_PROFILE);
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

  dom.questionCounter.textContent = `第 ${state.currentIndex + 1} / ${total} 题`;
  dom.progressFill.style.width = `${progress}%`;
  dom.brainMeter.textContent = `脑子剩余 ${Math.max(0, 100 - Math.round((state.currentIndex / total) * 100))}%`;
  dom.questionStem.textContent = question.stem;
  dom.questionStoryline.textContent = question.storyline || "";

  dom.optionsContainer.innerHTML = "";
  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-card";
    button.type = "button";
    button.innerHTML = `<span class="option-key">${option.id}</span><span class="option-text">${option.text}</span>`;
    button.addEventListener("click", () => {
      state.answers.push({ question, option });
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeScore(actual, min, max) {
  if (max === min) {
    return 50;
  }
  return Math.round(((actual - min) / (max - min)) * 100);
}

function calculateDimensionScores() {
  const tracks = {};
  DIMENSION_ORDER.forEach((dimension) => {
    tracks[dimension] = { actual: 0, min: 0, max: 0, touched: 0 };
  });

  state.answers.forEach(({ question, option }) => {
    DIMENSION_ORDER.forEach((dimension) => {
      const values = question.options.map((item) => (item.weights && item.weights[dimension]) || 0);
      const hasDimension = values.some((value) => value !== 0);
      if (!hasDimension) {
        return;
      }
      tracks[dimension].touched += 1;
      tracks[dimension].actual += (option.weights && option.weights[dimension]) || 0;
      tracks[dimension].min += Math.min(...values);
      tracks[dimension].max += Math.max(...values);
    });
  });

  const normalized = {};
  DIMENSION_ORDER.forEach((dimension) => {
    const track = tracks[dimension];
    normalized[dimension] = track.touched ? normalizeScore(track.actual, track.min, track.max) : 50;
  });
  return normalized;
}

function calculateBrainlessIndex(dimensionScores) {
  let weightedSum = 0;
  let totalWeight = 0;
  Object.entries(BRAINLESS_WEIGHTS).forEach(([dimension, weight]) => {
    const score = dimensionScores[dimension] ?? 50;
    const effectiveScore = weight >= 0 ? score : 100 - score;
    weightedSum += Math.abs(weight) * effectiveScore;
    totalWeight += Math.abs(weight);
  });
  return Math.round(weightedSum / totalWeight);
}

function personaAffinity(meta, dimensionScores) {
  return DIMENSION_ORDER.reduce((sum, dimension) => {
    const target = meta.targets[dimension] ?? 50;
    let importance = 0.55;
    if ((meta.primary || []).includes(dimension)) {
      importance = 1.8;
    } else if ((meta.secondary || []).includes(dimension)) {
      importance = 1.1;
    }
    const actual = dimensionScores[dimension] ?? 50;
    const similarity = 100 - Math.abs(actual - target);
    let score = sum + similarity * importance;

    if (target >= 90 && actual < 70) {
      score -= (70 - actual) * importance * 1.5;
    } else if (target >= 80 && actual < 60) {
      score -= (60 - actual) * importance * 1.1;
    } else if (target >= 70 && actual < 50) {
      score -= (50 - actual) * importance * 0.8;
    }

    if (target <= 10 && actual > 35) {
      score -= (actual - 35) * importance * 1.4;
    } else if (target <= 20 && actual > 50) {
      score -= (actual - 50) * importance * 1.0;
    } else if (target <= 30 && actual > 65) {
      score -= (actual - 65) * importance * 0.6;
    }

    return score;
  }, 0);
}

function applyPersonaBounds(meta, dimensionScores, score) {
  let nextScore = score;
  Object.entries(meta.min_scores || {}).forEach(([dimension, minimum]) => {
    const actual = dimensionScores[dimension] ?? 50;
    if (actual < minimum) {
      nextScore -= (minimum - actual) * 2.6;
    }
  });
  Object.entries(meta.max_scores || {}).forEach(([dimension, maximum]) => {
    const actual = dimensionScores[dimension] ?? 50;
    if (actual > maximum) {
      nextScore -= (actual - maximum) * 2.2;
    }
  });
  return nextScore;
}

function pickPersona(dimensionScores) {
  let winnerName = null;
  let winnerScore = -Infinity;
  Object.entries(PERSONA_LIBRARY).forEach(([name, meta]) => {
    const score = applyPersonaBounds(meta, dimensionScores, personaAffinity(meta, dimensionScores));
    if (score > winnerScore) {
      winnerName = name;
      winnerScore = score;
    }
  });
  return winnerName;
}

function getVerdictLabel(index) {
  if (index < 20) {
    return "人味尚存";
  }
  if (index < 40) {
    return "轻度短剧化";
  }
  if (index < 60) {
    return "中度供梗体";
  }
  if (index < 80) {
    return "重度发疯体";
  }
  return "钛合金脑残圣体";
}

function getDimensionMeta(name) {
  return DIMENSION_META_MAP[name] || {
    name,
    label: name,
    group: "未分类",
    summary: "",
  };
}

function getDimensionLevel(score) {
  if (score < 20) {
    return "人味尚存";
  }
  if (score < 40) {
    return "轻度上头";
  }
  if (score < 60) {
    return "中度入戏";
  }
  if (score < 80) {
    return "重度供梗";
  }
  return "晚期发病";
}

function buildDimensionRatings(dimensionScores) {
  return DIMENSION_ORDER.map((dimension) => {
    const meta = getDimensionMeta(dimension);
    const score = dimensionScores[dimension] ?? 50;
    return {
      name: dimension,
      label: meta.label,
      group: meta.group,
      summary: meta.summary,
      score,
      level: getDimensionLevel(score),
    };
  });
}

function getTopDimensions(dimensionScores, count = 3) {
  return Object.entries(dimensionScores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, count)
    .map(([dimension, score]) => {
      const meta = getDimensionMeta(dimension);
      return {
        name: dimension,
        dimension,
        label: meta.label,
        score,
        level: getDimensionLevel(score),
      };
    });
}

function buildPosterStory(personaMeta, brainlessIndex, topDimensions) {
  const dimensionText = topDimensions.map((item) => `${item.label}${item.score}`).join(" / ");
  return `你的脑子最爱在 ${dimensionText} 这几处集体塌方。扔进 ${personaMeta.genres[0]} 赛道，你大概率会被剪成 ${personaMeta.roles[0]} 位：情绪先炸，判断后补，逻辑只在片尾彩蛋里短暂出现。当前脑残指数 ${brainlessIndex}，已经到了看见认亲线索都会自动坐直的程度。`;
}

function getDimensionScoreValue(dimensionRatings, dimensionName) {
  return dimensionRatings.find((item) => item.name === dimensionName)?.score ?? 50;
}

function buildDetailedAnalysis(personaMeta, brainlessIndex, topDimensions, dimensionRatings) {
  const [first, second, third] = topDimensions;
  const safe = (item, fallback) => (item ? `${item.label}${item.score}` : fallback);
  const highBackbone = dimensionRatings
    .filter((item) => item.score >= 60)
    .slice(0, 4)
    .map((item) => item.label.replace("指数", ""))
    .join("、");
  const habitText = highBackbone || "离谱剧情惯性";
  const controlScore = getDimensionScoreValue(dimensionRatings, "做局清算");
  const rageScore = getDimensionScoreValue(dimensionRatings, "爆冲翻脸");
  const fantasyScore = getDimensionScoreValue(dimensionRatings, "外挂吞钩");
  const oldLoveScore = getDimensionScoreValue(dimensionRatings, "旧情滤镜");
  const greenScore = getDimensionScoreValue(dimensionRatings, "绿帽耐受");
  const sacrificeScore = getDimensionScoreValue(dimensionRatings, "献祭填坑");
  const crowdScore = Math.round(
    (
      getDimensionScoreValue(dimensionRatings, "炒茶拱火") +
      getDimensionScoreValue(dimensionRatings, "站队复读") +
      getDimensionScoreValue(dimensionRatings, "跪舔换边") +
      getDimensionScoreValue(dimensionRatings, "门槛压人")
    ) / 4,
  );
  const relationshipScore = Math.round((oldLoveScore + greenScore + sacrificeScore) / 3);
  const spectacleScore = Math.round(
    (
      getDimensionScoreValue(dimensionRatings, "台词膨胀") +
      getDimensionScoreValue(dimensionRatings, "掉马妄想") +
      fantasyScore
    ) / 3,
  );

  let patternText = "你最致命的毛病，是明明已经看见离谱苗头，还总想替剧情再续半口气。";
  if (relationshipScore >= crowdScore && relationshipScore >= spectacleScore) {
    patternText = "你在关系局里最容易失手。只要旧情、越界和情感绑架一起出现，你就会本能地替别人找苦衷，把该翻脸的时刻硬拖成继续消耗自己的长线苦情戏。";
  } else if (crowdScore >= relationshipScore && crowdScore >= spectacleScore) {
    patternText = "你在群像局里最容易上头。风向一变、强弱一分、场面一热，你就会忍不住跟着补口径、换位置、替更吵的那边把刀递完整。";
  } else {
    patternText = "你对爽文刺激的耐受已经很低了。狠话、掉马、认亲、外挂这些词一冒头，你就容易先被脑内配乐劫持，再把现实判断外包给戏剧高潮。";
  }

  let triggerText = `平时看起来像还能讲理，真进冲突现场，你的判断力就会优先押给 ${habitText}。`;
  if (controlScore >= 72) {
    triggerText = `好在你的做局清算指数还有 ${controlScore}，说明你不是纯莽，你知道什么时候该留证、什么时候该等对方再多露半张底牌。只是只要被踩中 ${habitText} 这些点，耐心就会开始松。`;
  } else if (rageScore >= 70) {
    triggerText = `你现在最危险的短板，是爆冲翻脸 ${rageScore} 配上做局清算 ${controlScore}。这意味着你经常还没把证据攒齐，就已经先想把桌子、关系和场面一起炸穿，爽是爽了，后手也跟着烧没。`;
  } else {
    triggerText = `你这套反应不是单点失控，而是慢慢被拖进戏里。先是把边界让掉一点，再替离谱解释一点，等真的想反击时，局势往往已经被别人带到他们更擅长的频道里。`;
  }

  let finaleText = `脑残指数 ${brainlessIndex} 不只是一个乐子分，它说明你已经具备把普通矛盾活活演成连载狗血长篇的稳定天赋。扔进 ${personaMeta.genres[0]} 赛道，你基本会被剪成 ${personaMeta.roles[0]} 位：前半段替剧情续命，后半段再替自己的上头买单。`;
  if (spectacleScore >= 72) {
    finaleText = `脑残指数 ${brainlessIndex} 说明你已经很适合被扔进 ${personaMeta.genres[0]} 赛道做高浓度燃料了。编剧只要给你配一通电话、一块玉佩或者一句“其实你身份不简单”，你就能立刻从普通人切到 ${personaMeta.roles[0]} 模式，开始给自己脑补整季反杀分镜。`;
  } else if (relationshipScore >= 72) {
    finaleText = `脑残指数 ${brainlessIndex} 说明你特别适合被编剧拿去做苦主型角色耗材。放进 ${personaMeta.genres[0]} 里，你大概率会被剪成 ${personaMeta.roles[0]}：委屈吞得比谁都整齐，醒悟永远晚半拍，专门负责把观众血压托上去。`;
  }

  return [
    { title: "核心病灶", text: `你这套脑回路不是某一根线断了，而是 ${safe(first, "旧情滤镜")}、${safe(second, "爆冲翻脸")}、${safe(third, "外挂吞钩")} 几根线同时拧死。${patternText}` },
    { title: "发病现场", text: triggerText },
    { title: "结局分镜", text: finaleText },
  ];
}

function renderPosterDimensionStrip(topDimensions) {
  dom.posterDimensionStrip.innerHTML = "";
  topDimensions.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "poster-dimension-chip";
    chip.textContent = `${item.label}${item.score}`;
    dom.posterDimensionStrip.appendChild(chip);
  });
}

function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildResultTokenPayload(personaName, brainlessIndex, verdictLabel, topDimensions, hiddenHits) {
  return {
    v: "v1",
    p: personaName,
    b: brainlessIndex,
    l: verdictLabel,
    d: topDimensions.map((item) => [item.name || item.dimension, item.score]),
    h: hiddenHits.map((item) => [item.name, item.score]),
  };
}

function buildPosterCommand(resultToken) {
  return `给 zzti 生结果图：${resultToken}`;
}

function renderDimensionList(dimensionRatings) {
  dom.dimensionList.innerHTML = "";
  dimensionRatings.forEach((itemData) => {
    const value = itemData.score;
    const item = document.createElement("div");
    item.className = "dimension-item";
    item.innerHTML = `
      <div class="dimension-item-head">
        <span>${itemData.label}</span>
        <strong>${value}</strong>
      </div>
      <div class="dimension-item-meta">
        <span>${itemData.level}</span>
        <em>${itemData.summary}</em>
      </div>
      <div class="dimension-track">
        <div class="dimension-bar" style="width:${value}%"></div>
      </div>
    `;
    dom.dimensionList.appendChild(item);
  });
}

function renderTags(container, values) {
  container.innerHTML = "";
  values.forEach((value) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = value;
    container.appendChild(tag);
  });
}

function buildShareText(personaName, personaMeta, brainlessIndex, topDimensions) {
  return [
    `ZZTI 测试结果：${personaName}`,
    `脑残指数：${brainlessIndex}`,
    `适配赛道：${personaMeta.genres.join(" / ")}`,
    `高频角色位：${personaMeta.roles.join(" / ")}`,
    `高危指数：${topDimensions.map((item) => `${item.label}${item.score}(${item.level})`).join(" / ")}`,
    "诊断结论：脑子已经被短剧腌透了",
  ].join("\n");
}

function renderResult() {
  const dimensionScores = calculateDimensionScores();
  const dimensionRatings = buildDimensionRatings(dimensionScores);
  const brainlessIndex = calculateBrainlessIndex(dimensionScores);
  const personaKey = pickPersona(dimensionScores);
  const personaMeta = PERSONA_LIBRARY[personaKey];
  const personaName = personaMeta.display_name || personaKey;
  const verdictLabel = getVerdictLabel(brainlessIndex);
  const topDimensions = getTopDimensions(dimensionScores);
  const hiddenHits = [];
  const detailedAnalysis = buildDetailedAnalysis(personaMeta, brainlessIndex, topDimensions, dimensionRatings);
  const resultTokenPayload = buildResultTokenPayload(personaName, brainlessIndex, verdictLabel, topDimensions, hiddenHits);
  const resultToken = `${RESULT_TOKEN_PREFIX}${encodeBase64Url(JSON.stringify(resultTokenPayload))}`;
  const posterCommand = buildPosterCommand(resultToken);
  const personaAsset = personaMeta.asset || "./assets/deco-art.svg";
  const personaCaption = `${personaName} · ${personaMeta.quote}`;

  dom.resultTitle.textContent = `你是【${personaName}】`;
  dom.resultSubtitle.textContent = `很不幸，${personaMeta.tagline}`;
  dom.posterTitle.textContent = personaName;
  dom.posterAnalysis.innerHTML = detailedAnalysis
    .map(
      (item, index) => `
        <article class="analysis-card analysis-card-${index + 1}">
          <span class="analysis-card-title">${item.title}</span>
          <p>${item.text}</p>
        </article>
      `,
    )
    .join("");
  renderPosterDimensionStrip(topDimensions);
  dom.brainlessIndex.textContent = `${brainlessIndex}`;
  dom.brainlessFill.style.width = `${clamp(brainlessIndex, 0, 100)}%`;
  dom.brainlessVerdict.textContent = `${verdictLabel} · 脑子剩余 ${Math.max(0, 100 - brainlessIndex)}%，但不多。`;
  dom.resultVerdict.textContent = `${personaMeta.verdict} 说白了，你不是没见过离谱，是你已经开始替离谱辩护了。`;
  dom.resultQuote.textContent = personaMeta.quote;
  dom.bridgeNote.textContent = "网页测完后，点“生成结果图口令”，再把这段口令贴回飞书里的 OpenClaw，ZZTI 就会调 Wan2.7 生图。";
  dom.personaFigureImage.src = personaAsset;
  dom.personaFigureImage.alt = `${personaName} 角色形象图`;
  dom.personaFigureHint.textContent = `点击放大 ${personaName} 角色形象`;
  dom.personaFigureImage.onerror = () => {
    dom.personaFigureImage.onerror = null;
    dom.personaFigureImage.src = "./assets/deco-art.svg";
    dom.personaFigureHint.textContent = `${personaName} 角色图待补`;
  };
  dom.personaFigureButton.onclick = () => showLightbox(personaAsset, personaCaption);

  renderDimensionList(dimensionRatings);
  renderTags(dom.genreTags, personaMeta.genres);
  renderTags(dom.roleTags, personaMeta.roles);

  dom.copyButton.onclick = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(personaName, personaMeta, brainlessIndex, topDimensions));
      dom.copyButton.textContent = "已复制";
      window.setTimeout(() => {
        dom.copyButton.textContent = "复制结果";
      }, 1200);
    } catch (error) {
      dom.copyButton.textContent = "复制失败";
      window.setTimeout(() => {
        dom.copyButton.textContent = "复制结果";
      }, 1200);
    }
  };

  dom.posterButton.onclick = async () => {
    try {
      await navigator.clipboard.writeText(posterCommand);
      dom.posterButton.textContent = "口令已复制";
      window.setTimeout(() => {
        dom.posterButton.textContent = "生成结果图口令";
      }, 1400);
    } catch (error) {
      dom.posterButton.textContent = "复制失败";
      window.setTimeout(() => {
        dom.posterButton.textContent = "生成结果图口令";
      }, 1400);
    }
  };

  showSection("result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function applyModelConfig(model) {
  state.model = model;
  DIMENSION_ORDER = model.dimensions || [];
  DIMENSION_METADATA = model.dimension_metadata || [];
  DIMENSION_META_MAP = Object.fromEntries(DIMENSION_METADATA.map((item) => [item.name, item]));
  BRAINLESS_WEIGHTS = model.brainless_weights || {};
  PERSONA_LIBRARY = model.persona_library || {};
}

function applyProfileConfig(bank) {
  if (!bank.selection_profiles) {
    return;
  }
  PROFILE_CONFIG = Object.fromEntries(
    Object.entries(bank.selection_profiles).map(([profile, cfg]) => [
      profile,
      {
        core: cfg.core,
        calibration: cfg.calibration,
        antiConflict: cfg.anti_conflict,
        hidden: cfg.hidden,
      },
    ]),
  );
}

async function loadResources() {
  try {
    const [bankResponse, modelResponse] = await Promise.all([
      fetch(QUESTION_BANK_URL),
      fetch(MODEL_CONFIG_URL),
    ]);
    if (!bankResponse.ok) {
      throw new Error(`question bank HTTP ${bankResponse.status}`);
    }
    if (!modelResponse.ok) {
      throw new Error(`model config HTTP ${modelResponse.status}`);
    }
    state.bank = await bankResponse.json();
    applyProfileConfig(state.bank);
    applyModelConfig(await modelResponse.json());
    updateStartButton();
    dom.loadStatus.textContent = "";
    dom.loadStatus.classList.add("is-hidden");
  } catch (error) {
    dom.startButton.textContent = "题库加载失败";
    dom.loadStatus.classList.remove("is-hidden");
    dom.loadStatus.textContent = "当前站点需要通过 HTTP 或 GitHub Pages 打开，不能直接 file:// 打开。";
    console.error(error);
  }
}

function bindEvents() {
  dom.startButton.addEventListener("click", () => {
    if (!state.bank || !state.model) {
      return;
    }
    startTest();
  });

  dom.homeButton.addEventListener("click", () => {
    showSection("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  dom.restartButton.addEventListener("click", () => {
    startTest();
  });

  dom.lightboxBackdrop.addEventListener("click", hideLightbox);
  dom.lightboxClose.addEventListener("click", hideLightbox);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.imageLightbox.classList.contains("is-hidden")) {
      hideLightbox();
    }
  });
}

function init() {
  bindEvents();
  loadResources();
}

init();
