const QUESTION_BANK_URL = "./data/question-bank.v1.json";
const MODEL_CONFIG_URL = "./data/model-config.v1.json";
const ACTIVE_PROFILE = "full";
const RESULT_TOKEN_PREFIX = "ZZTI_PAYLOAD::";

let PROFILE_CONFIG = {
  quick: { core: 23, calibration: 7, antiConflict: 3, hidden: 2 },
  standard: { core: 26, calibration: 8, antiConflict: 4, hidden: 2 },
  full: { core: 32, calibration: 10, antiConflict: 5, hidden: 3 },
};

let DIMENSION_ORDER = [];
let BRAINLESS_WEIGHTS = {};
let PERSONA_LIBRARY = {};
let HIDDEN_LIBRARY = {};

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
  questionType: document.getElementById("questionType"),
  progressFill: document.getElementById("progressFill"),
  brainMeter: document.getElementById("brainMeter"),
  questionGenre: document.getElementById("questionGenre"),
  questionSource: document.getElementById("questionSource"),
  questionKicker: document.getElementById("questionKicker"),
  questionStem: document.getElementById("questionStem"),
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
  resultSerial: document.getElementById("resultSerial"),
  resultRank: document.getElementById("resultRank"),
  posterCode: document.getElementById("posterCode"),
  posterRank: document.getElementById("posterRank"),
  posterTitle: document.getElementById("posterTitle"),
  posterStory: document.getElementById("posterStory"),
  restartButton: document.getElementById("restartButton"),
  copyButton: document.getElementById("copyButton"),
  posterButton: document.getElementById("posterButton"),
  bridgeNote: document.getElementById("bridgeNote"),
};

function shuffle(array) {
  const copy = array.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function uniquePush(target, item, predicate) {
  if (!target.some(predicate)) {
    target.push(item);
  }
}

function primaryDimension(question) {
  const dimensions = question.primary_dimensions || [];
  if (dimensions.length) {
    return dimensions[0];
  }
  return question.dimension || "未分类";
}

function sceneCluster(question) {
  return question.scene_cluster || "通用场景";
}

function chooseCore(coreQuestions, count) {
  const byDimension = {};
  coreQuestions.forEach((question) => {
    const dimension = primaryDimension(question);
    if (!byDimension[dimension]) {
      byDimension[dimension] = [];
    }
    byDimension[dimension].push(question);
  });

  const selected = [];
  const selectedIds = new Set();
  const usedScenarios = new Set();

  const addIfPossible = (question) => {
    const scenarioId = question.scenario_id || question.id;
    if (selectedIds.has(question.id) || usedScenarios.has(scenarioId)) {
      return false;
    }
    selected.push(question);
    selectedIds.add(question.id);
    usedScenarios.add(scenarioId);
    return true;
  };

  shuffle(Object.keys(byDimension)).forEach((dimension) => {
    if (selected.length >= count) {
      return;
    }
    const pool = shuffle(byDimension[dimension]);
    const candidate = pool.find((item) => !usedScenarios.has(item.scenario_id || item.id));
    if (candidate) {
      addIfPossible(candidate);
    }
  });

  const allGenres = shuffle([...new Set(coreQuestions.map((question) => question.genre || "通用剧情"))]);
  allGenres.forEach((genre) => {
    if (selected.length >= count) {
      return;
    }
    if (selected.some((item) => (item.genre || "通用剧情") === genre)) {
      return;
    }
    const pool = shuffle(coreQuestions.filter((question) => (question.genre || "通用剧情") === genre));
    pool.some((question) => addIfPossible(question));
  });

  const allClusters = shuffle([...new Set(coreQuestions.map((question) => sceneCluster(question)))]);
  allClusters.forEach((cluster) => {
    if (selected.length >= count) {
      return;
    }
    if (selected.some((item) => sceneCluster(item) === cluster)) {
      return;
    }
    const pool = shuffle(coreQuestions.filter((question) => sceneCluster(question) === cluster));
    pool.some((question) => addIfPossible(question));
  });

  const dimensionCounts = {};
  const genreCounts = {};
  const clusterCounts = {};
  selected.forEach((question) => {
    const dimension = primaryDimension(question);
    const genre = question.genre || "通用剧情";
    const cluster = sceneCluster(question);
    dimensionCounts[dimension] = (dimensionCounts[dimension] || 0) + 1;
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
  });

  const remainingPool = shuffle(coreQuestions).sort((left, right) => {
    const leftKey = [
      dimensionCounts[primaryDimension(left)] || 0,
      genreCounts[left.genre || "通用剧情"] || 0,
      clusterCounts[sceneCluster(left)] || 0,
    ];
    const rightKey = [
      dimensionCounts[primaryDimension(right)] || 0,
      genreCounts[right.genre || "通用剧情"] || 0,
      clusterCounts[sceneCluster(right)] || 0,
    ];
    for (let index = 0; index < leftKey.length; index += 1) {
      if (leftKey[index] !== rightKey[index]) {
        return leftKey[index] - rightKey[index];
      }
    }
    return 0;
  });

  remainingPool.forEach((question) => {
    if (selected.length >= count) {
      return;
    }
    const dimension = primaryDimension(question);
    const genre = question.genre || "通用剧情";
    const cluster = sceneCluster(question);
    if ((dimensionCounts[dimension] || 0) >= 3) {
      return;
    }
    if ((genreCounts[genre] || 0) >= 5) {
      return;
    }
    if ((clusterCounts[cluster] || 0) >= 5) {
      return;
    }
    if (!addIfPossible(question)) {
      return;
    }
    dimensionCounts[dimension] = (dimensionCounts[dimension] || 0) + 1;
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    clusterCounts[cluster] = (clusterCounts[cluster] || 0) + 1;
  });

  if (selected.length < count) {
    shuffle(coreQuestions).forEach((question) => {
      if (selected.length < count) {
        addIfPossible(question);
      }
    });
  }

  return selected;
}

function chooseCalibration(calibrationQuestions, count, antiConflictCount) {
  const antiConflictPool = calibrationQuestions.filter((question) => question.subtype === "anti_conflict");
  const generalCalibrationPool = calibrationQuestions.filter((question) => question.subtype !== "anti_conflict");

  const selectedCalibration = [];
  const calibrationByDimension = {};
  generalCalibrationPool.forEach((question) => {
    if (!calibrationByDimension[question.dimension]) {
      calibrationByDimension[question.dimension] = [];
    }
    calibrationByDimension[question.dimension].push(question);
  });

  shuffle(Object.keys(calibrationByDimension)).forEach((dimension) => {
    if (selectedCalibration.length < count) {
      selectedCalibration.push(shuffle(calibrationByDimension[dimension])[0]);
    }
  });

  shuffle(generalCalibrationPool).forEach((question) => {
    if (selectedCalibration.length < count) {
      uniquePush(selectedCalibration, question, (item) => item.id === question.id);
    }
  });

  const selectedAntiConflict = [];
  const antiByDimension = {};
  antiConflictPool.forEach((question) => {
    if (!antiByDimension[question.dimension]) {
      antiByDimension[question.dimension] = [];
    }
    antiByDimension[question.dimension].push(question);
  });

  shuffle(Object.keys(antiByDimension)).forEach((dimension) => {
    if (selectedAntiConflict.length < antiConflictCount) {
      selectedAntiConflict.push(shuffle(antiByDimension[dimension])[0]);
    }
  });

  shuffle(antiConflictPool).forEach((question) => {
    if (selectedAntiConflict.length < antiConflictCount) {
      uniquePush(selectedAntiConflict, question, (item) => item.id === question.id);
    }
  });

  return { selectedCalibration, selectedAntiConflict };
}

function chooseHidden(hiddenQuestions, count) {
  const selectedHidden = [];
  const hiddenByTarget = {};
  hiddenQuestions.forEach((question) => {
    if (!hiddenByTarget[question.hidden_target]) {
      hiddenByTarget[question.hidden_target] = [];
    }
    hiddenByTarget[question.hidden_target].push(question);
  });

  Object.keys(hiddenByTarget).forEach((target) => {
    if (selectedHidden.length < count) {
      selectedHidden.push(shuffle(hiddenByTarget[target])[0]);
    }
  });

  shuffle(hiddenQuestions).forEach((question) => {
    if (selectedHidden.length < count) {
      uniquePush(selectedHidden, question, (item) => item.id === question.id);
    }
  });

  return selectedHidden;
}

function buildPaper(profile = "standard") {
  const config = PROFILE_CONFIG[profile];
  const coreQuestions = state.bank.core_questions;
  const calibrationQuestions = state.bank.calibration_questions;
  const hiddenQuestions = state.bank.hidden_trigger_questions;
  const selectedCore = chooseCore(coreQuestions, config.core);
  const { selectedCalibration, selectedAntiConflict } = chooseCalibration(
    calibrationQuestions,
    config.calibration,
    config.antiConflict,
  );
  const selectedHidden = chooseHidden(hiddenQuestions, config.hidden);

  return {
    profile,
    questions: shuffle([
      ...selectedCore,
      ...selectedCalibration,
      ...selectedAntiConflict,
      ...selectedHidden,
    ]),
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
  dom.startButton.textContent = `开始发疯测试 · ${getProfileQuestionCount(ACTIVE_PROFILE)}题`;
}

function getQuestionTypeLabel(question) {
  if (question.question_type === "core") {
    return "核心题";
  }
  if (question.question_type === "hidden_trigger") {
    return "隐藏题";
  }
  if (question.subtype === "anti_conflict") {
    return "反矛盾题";
  }
  return "校准题";
}

function getQuestionSceneLabel(question) {
  if (question.question_type === "core") {
    return `剧情壳 · ${question.genre || "剧情现场"}`;
  }
  if (question.question_type === "hidden_trigger") {
    return "剧情癖好";
  }
  return "日常反应";
}

function getQuestionConflictLabel(question) {
  if (question.question_type === "core") {
    const tags = (question.tags || []).slice(0, 2).join(" · ");
    return `冲突词 · ${tags || "剧情冲突"}`;
  }
  if (question.question_type === "hidden_trigger") {
    const tags = (question.tags || []).slice(0, 2).join(" · ");
    return `爽点词 · ${tags || "隐藏倾向"}`;
  }
  return `校准线 · ${question.dimension || "维度校准"}`;
}

function getQuestionKicker(question) {
  if (question.question_type === "core") {
    const dimensions = (question.primary_dimensions || []).slice(0, 2).join(" / ");
    return `这题主要看：${dimensions}。别拿台词骗自己，先代入这段剧情再选。`;
  }
  if (question.question_type === "hidden_trigger") {
    return "这题在看你到底是不是已经被狗血桥段训练成了条件反射。";
  }
  return `这题做日常校准，主要量你在 ${question.dimension || "一致性"} 这条线上到底会不会失守。`;
}

function showSection(section) {
  dom.landingSection.classList.toggle("is-hidden", section !== "landing");
  dom.quizSection.classList.toggle("is-hidden", section !== "quiz");
  dom.resultSection.classList.toggle("is-hidden", section !== "result");
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
  dom.questionType.textContent = getQuestionTypeLabel(question);
  dom.progressFill.style.width = `${progress}%`;
  dom.brainMeter.textContent = `脑子剩余 ${Math.max(0, 100 - Math.round((state.currentIndex / total) * 100))}%`;
  dom.questionGenre.textContent = getQuestionSceneLabel(question);
  dom.questionSource.textContent = getQuestionConflictLabel(question);
  dom.questionKicker.textContent = getQuestionKicker(question);
  dom.questionStem.textContent = question.stem;

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
    if (question.question_type === "hidden_trigger") {
      return;
    }
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

function calculateHiddenScores() {
  const hiddenTracks = {};
  Object.keys(HIDDEN_LIBRARY).forEach((name) => {
    hiddenTracks[name] = { actual: 0, max: 0 };
  });

  state.answers.forEach(({ question, option }) => {
    if (question.question_type !== "hidden_trigger") {
      return;
    }
    const target = question.hidden_target;
    const values = question.options.map((item) => (item.hidden_weights && item.hidden_weights[target]) || 0);
    hiddenTracks[target].actual += (option.hidden_weights && option.hidden_weights[target]) || 0;
    hiddenTracks[target].max += Math.max(...values);
  });

  const normalized = {};
  Object.entries(hiddenTracks).forEach(([name, values]) => {
    normalized[name] = values.max ? Math.round((values.actual / values.max) * 100) : 0;
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
    const similarity = 100 - Math.abs((dimensionScores[dimension] ?? 50) - target);
    return sum + similarity * importance;
  }, 0);
}

function pickPersona(dimensionScores) {
  let winnerName = null;
  let winnerScore = -Infinity;
  Object.entries(PERSONA_LIBRARY).forEach(([name, meta]) => {
    const score = personaAffinity(meta, dimensionScores);
    if (score > winnerScore) {
      winnerName = name;
      winnerScore = score;
    }
  });
  return winnerName;
}

function getVerdictLabel(index) {
  if (index < 20) {
    return "还没彻底烂透";
  }
  if (index < 40) {
    return "轻度发病嘴硬怪";
  }
  if (index < 60) {
    return "稳定供梗中度患者";
  }
  if (index < 80) {
    return "高浓度降智污染源";
  }
  return "钛合金脑残圣体";
}

function getTopDimensions(dimensionScores, count = 3) {
  return Object.entries(dimensionScores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, count)
    .map(([dimension, score]) => ({ dimension, score }));
}

function buildSampleCode(personaName, brainlessIndex) {
  const initials = personaName
    .slice(0, 3)
    .split("")
    .map((char) => char.charCodeAt(0).toString(16).slice(-2))
    .join("")
    .toUpperCase();
  return `ZZ-${String(brainlessIndex).padStart(2, "0")}-${initials}`;
}

function buildPosterStory(personaMeta, brainlessIndex, topDimensions) {
  const dimensionText = topDimensions.map((item) => `${item.dimension}${item.score}`).join(" / ");
  return `你的脑子最爱在 ${dimensionText} 这几处集体塌方。扔进 ${personaMeta.genres[0]} 赛道，你大概率会被剪成 ${personaMeta.roles[0]} 位：情绪先炸，判断后补，逻辑只在片尾彩蛋里短暂出现。当前脑残指数 ${brainlessIndex}，已经到了看见认亲线索都会自动坐直的程度。`;
}

function getHiddenHits(hiddenScores, threshold = 70) {
  return Object.entries(hiddenScores)
    .sort((left, right) => right[1] - left[1])
    .filter(([, score]) => score >= threshold)
    .map(([name, score]) => ({ name, score }));
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
    d: topDimensions.map((item) => [item.dimension, item.score]),
    h: hiddenHits.map((item) => [item.name, item.score]),
  };
}

function buildPosterCommand(resultToken) {
  return `给 zzti 生结果图：${resultToken}`;
}

function renderDimensionList(dimensionScores) {
  dom.dimensionList.innerHTML = "";
  DIMENSION_ORDER.forEach((dimension) => {
    const value = dimensionScores[dimension];
    const item = document.createElement("div");
    item.className = "dimension-item";
    item.innerHTML = `
      <div class="dimension-item-head">
        <span>${dimension}</span>
        <strong>${value}</strong>
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

function buildShareText(personaName, personaMeta, brainlessIndex) {
  return [
    `ZZTI 测试结果：${personaName}`,
    `脑残指数：${brainlessIndex}`,
    `适配赛道：${personaMeta.genres.join(" / ")}`,
    `高频角色位：${personaMeta.roles.join(" / ")}`,
    "诊断结论：脑子已经被短剧腌透了",
  ].join("\n");
}

function renderResult() {
  const dimensionScores = calculateDimensionScores();
  const hiddenScores = calculateHiddenScores();
  const brainlessIndex = calculateBrainlessIndex(dimensionScores);
  const personaKey = pickPersona(dimensionScores);
  const personaMeta = PERSONA_LIBRARY[personaKey];
  const personaName = personaMeta.display_name || personaKey;
  const verdictLabel = getVerdictLabel(brainlessIndex);
  const topDimensions = getTopDimensions(dimensionScores);
  const hiddenHits = getHiddenHits(hiddenScores);
  const sampleCode = buildSampleCode(personaName, brainlessIndex);
  const resultTokenPayload = buildResultTokenPayload(personaName, brainlessIndex, verdictLabel, topDimensions, hiddenHits);
  const resultToken = `${RESULT_TOKEN_PREFIX}${encodeBase64Url(JSON.stringify(resultTokenPayload))}`;
  const posterCommand = buildPosterCommand(resultToken);

  dom.resultTitle.textContent = `你是【${personaName}】`;
  dom.resultSubtitle.textContent = `很不幸，${personaMeta.tagline}`;
  dom.resultSerial.textContent = sampleCode;
  dom.resultRank.textContent = verdictLabel;
  dom.posterCode.textContent = sampleCode;
  dom.posterRank.textContent = verdictLabel;
  dom.posterTitle.textContent = personaName;
  dom.posterStory.textContent = buildPosterStory(personaMeta, brainlessIndex, topDimensions);
  dom.brainlessIndex.textContent = `${brainlessIndex}`;
  dom.brainlessFill.style.width = `${clamp(brainlessIndex, 0, 100)}%`;
  dom.brainlessVerdict.textContent = `${verdictLabel} · 脑子剩余 ${Math.max(0, 100 - brainlessIndex)}%，但不多。`;
  dom.resultVerdict.textContent = `${personaMeta.verdict} 说白了，你不是没见过离谱，是你已经开始替离谱辩护了。`;
  dom.resultQuote.textContent = personaMeta.quote;
  dom.bridgeNote.textContent = `网页测完后，点“生成结果图口令”，再把这段口令贴回飞书里的 OpenClaw，ZZTI 就会调 Wan2.7 生图。结果编号：${sampleCode}`;

  renderDimensionList(dimensionScores);
  renderTags(dom.genreTags, personaMeta.genres);
  renderTags(dom.roleTags, personaMeta.roles);

  dom.copyButton.onclick = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(personaName, personaMeta, brainlessIndex));
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
  BRAINLESS_WEIGHTS = model.brainless_weights || {};
  PERSONA_LIBRARY = model.persona_library || {};
  HIDDEN_LIBRARY = model.hidden_library || {};
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
}

function init() {
  bindEvents();
  loadResources();
}

init();
