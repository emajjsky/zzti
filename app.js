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
const OPTION_LABELS = ["A", "B", "C", "D"];
const PERSONA_CLUSTERS = {
  relationship: ["旧情滤镜", "绿帽耐受", "献祭填坑"],
  crowd: ["炒茶拱火", "站队复读", "跪舔换边", "门槛压人"],
  spectacle: ["台词膨胀", "掉马妄想", "外挂吞钩"],
  retaliation: ["爆冲翻脸", "做局清算"],
};
const POSITIVE_DIMENSIONS = new Set(["做局清算"]);
const GENRE_BUCKET_MAP = {
  "现代女频": "femaleish",
  "家庭伦理": "femaleish",
  "豪门婚恋": "femaleish",
  "古装宅斗": "femaleish",
  "都市男频": "maleish",
  "都市商战": "maleish",
  "年代商战": "maleish",
  "金融系统": "maleish",
  "都市创业": "maleish",
};
const DIMENSION_DIAGNOSTICS = {
  "旧情滤镜": {
    high: "你对旧关系的情绪记忆太长，别人只要抛一个苦衷，你就容易把旧账重新当未完待续。",
    low: "好在你对旧情这块还没完全失守，至少不是别人一回头你就自动替人减刑。",
  },
  "绿帽耐受": {
    high: "边界一被踩，你第一反应不是翻脸，而是替这段关系找补丁，耐受高得有点离谱。",
    low: "你对越界行为还有基本警觉，不至于别人把暧昧贴到脸上你都继续装看不见。",
  },
  "献祭填坑": {
    high: "你太容易把别人的烂摊子背成自己的责任，谁会哭、谁会闹、谁会拿亲情压你，谁就更容易从你身上拆资源。",
    low: "你在填坑这件事上还算有点刹车，不至于谁一卖惨你就连前途都往外掏。",
  },
  "炒茶拱火": {
    high: "你很懂一句话该怎么递、递给谁最炸，很多局不是你开的，但你特别会往火里补风。",
    low: "你至少不是那种见缝就递刀的人，很多热闹你看得出，却未必急着亲手点着。",
  },
  "台词膨胀": {
    high: "牌还没翻，狠话先落地，这种先把气势做满的冲动在你身上很重。",
    low: "你嘴上还算克制，不至于实力没到就先靠台词把自己吹成大结局。",
  },
  "爆冲翻脸": {
    high: "你被踩到点时起爆很快，情绪上头后第一反应就是把桌子、关系和场子一起掀了。",
    low: "你至少没到见火就炸的程度，很多场合还知道先压一下，不让自己立刻变现场火药桶。",
  },
  "站队复读": {
    high: "场上一旦有主流口径，你很容易接着复读，顺手把别人的偏见喊成自己的立场。",
    low: "你在跟风这块还留着点判断，不至于谁声音大你就自动替谁扩音。",
  },
  "跪舔换边": {
    high: "你对风向的反应太快了，谁势大就往谁那边挪，保命和讨好常常压过原则。",
    low: "你对强弱风向至少还有点抵抗力，不会一看到大人物脸色就立刻原地变色。",
  },
  "门槛压人": {
    high: "你看人很容易先看身价、背景和能不能撑门面，现实嗅觉强，但也容易刻薄和势利。",
    low: "你至少没把门第当成唯一准绳，还保留一点先看人再看包装的能力。",
  },
  "做局清算": {
    high: "你不是不会忍，而是懂得留证、记账、攒局，很多人刚开口时你已经在算收网时间。",
    low: "你在后手这块偏弱，容易气还没消就先把牌掀了，结果爽完才想起证据链没补齐。",
  },
  "掉马妄想": {
    high: "只要剧情给你一点身份暗示，你脑子里的掉马 BGM 就会自动响，翻盘分镜比证据跑得还快。",
    low: "你对掉马这套还算冷静，不至于半句暗示就先给自己脑补出全员跪地认错。",
  },
  "外挂吞钩": {
    high: "系统、萌宝、认亲、神迹这些钩子对你太有效了，越离谱的桥段，你越容易先吞一半。",
    low: "你对外挂味道还有点免疫，至少不会什么都往天命和奇迹上靠。",
  },
};

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

function getGenreBucket(genre) {
  return GENRE_BUCKET_MAP[genre] || genre;
}

function chooseCore(coreQuestions, count, seed) {
  const ordered = coreQuestions
    .slice()
    .sort((left, right) => (left.order || 0) - (right.order || 0))
    .map(cloneQuestion);

  const remaining = ordered.slice();
  const picked = [];

  while (remaining.length) {
    const last = picked[picked.length - 1];
    const beforeLast = picked[picked.length - 2];

    let winnerIndex = 0;
    let winnerScore = Infinity;

    remaining.forEach((question, index) => {
      let score = 0;

      if (last) {
        if (question.metric_name === last.metric_name) {
          score += 100;
        }
        if (question.genre === last.genre) {
          score += 24;
        } else if (getGenreBucket(question.genre) === getGenreBucket(last.genre)) {
          score += 11;
        }
        if (question.scene_cluster === last.scene_cluster) {
          score += 12;
        }
      }

      if (beforeLast) {
        if (question.metric_name === beforeLast.metric_name) {
          score += 18;
        }
        if (question.genre === beforeLast.genre) {
          score += 8;
        } else if (getGenreBucket(question.genre) === getGenreBucket(beforeLast.genre)) {
          score += 4;
        }
      }

      const metricRemaining = remaining.filter((item) => item.metric_name === question.metric_name).length;
      score -= metricRemaining * 4;
      score += hashString(`${seed}:${question.id}:order`) / 4294967296;

      if (score < winnerScore) {
        winnerScore = score;
        winnerIndex = index;
      }
    });

    const pickedQuestion = remaining.splice(winnerIndex, 1)[0];
    pickedQuestion.options = shuffleOptions(pickedQuestion, seed);
    pickedQuestion.paper_order = picked.length + 1;
    picked.push(pickedQuestion);
  }

  return picked.slice(0, count);
}

function createPaperSeed() {
  if (window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return buffer[0];
  }
  return Math.floor(Math.random() * 0xffffffff);
}

function buildPaper(profile = "standard", seed = createPaperSeed()) {
  const coreQuestions = state.bank.core_questions || [];
  const selectedCore = chooseCore(coreQuestions, coreQuestions.length, seed);
  return {
    profile,
    seed,
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

  dom.questionCounter.textContent = `第 ${state.currentIndex + 1} / ${total} 题`;
  dom.progressFill.style.width = `${progress}%`;
  dom.brainMeter.textContent = `脑子剩余 ${Math.max(0, 100 - Math.round((state.currentIndex / total) * 100))}%`;
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

function averageDimensionScore(source, dimensions, fallback = 50) {
  const values = dimensions
    .map((dimension) => source[dimension])
    .filter((value) => typeof value === "number");
  if (!values.length) {
    return fallback;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildClusterScores(source) {
  return Object.fromEntries(
    Object.entries(PERSONA_CLUSTERS).map(([cluster, dimensions]) => [
      cluster,
      averageDimensionScore(source, dimensions),
    ]),
  );
}

function buildDimensionRankMap(dimensionScores) {
  return Object.fromEntries(
    Object.entries(dimensionScores)
      .sort((left, right) => right[1] - left[1])
      .map(([dimension], index) => [dimension, index + 1]),
  );
}

function personaAffinity(meta, dimensionScores, context) {
  const { rankMap, clusterScores, topDimensionNames } = context;
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
  }, 0)
    + (() => {
      let score = 0;
      const targetClusterScores = buildClusterScores(meta.targets || {});
      Object.entries(targetClusterScores).forEach(([cluster, targetScore]) => {
        const actualScore = clusterScores[cluster] ?? 50;
        const diff = Math.abs(actualScore - targetScore);
        const clusterWeight = cluster === "relationship" || cluster === "spectacle" ? 0.9 : 0.7;
        score -= diff * clusterWeight;
      });

      (meta.primary || []).forEach((dimension) => {
        const rank = rankMap[dimension] ?? DIMENSION_ORDER.length;
        if (rank <= 3) {
          score += (4 - rank) * 14;
        } else if (rank <= 6) {
          score += (7 - rank) * 5;
        } else {
          score -= (rank - 6) * 5.5;
        }
      });

      (meta.secondary || []).forEach((dimension) => {
        const rank = rankMap[dimension] ?? DIMENSION_ORDER.length;
        if (rank <= 4) {
          score += (5 - rank) * 5;
        }
      });

      const dominantHitCount = topDimensionNames
        .slice(0, 3)
        .filter((dimension) => (meta.primary || []).includes(dimension)).length;
      if (!dominantHitCount) {
        score -= 26;
      } else {
        score += dominantHitCount * 8;
      }

      const offProfileDominants = topDimensionNames
        .slice(0, 3)
        .filter((dimension) => (meta.targets?.[dimension] ?? 50) <= 35);
      score -= offProfileDominants.length * 10;

      return score;
    })();
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

function rankPersonas(dimensionScores) {
  const rankMap = buildDimensionRankMap(dimensionScores);
  const clusterScores = buildClusterScores(dimensionScores);
  const topDimensionNames = Object.entries(dimensionScores)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([dimension]) => dimension);

  return Object.entries(PERSONA_LIBRARY)
    .map(([name, meta]) => ({
      name,
      score: applyPersonaBounds(
        meta,
        dimensionScores,
        personaAffinity(meta, dimensionScores, {
          rankMap,
          clusterScores,
          topDimensionNames,
        }),
      ),
    }))
    .sort((left, right) => right.score - left.score);
}

function pickPersona(dimensionScores) {
  return rankPersonas(dimensionScores)[0]?.name || null;
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

function getDimensionLevel(name, score) {
  if (POSITIVE_DIMENSIONS.has(name)) {
    if (score < 20) {
      return "当场送头";
    }
    if (score < 40) {
      return "后手偏少";
    }
    if (score < 60) {
      return "勉强能忍";
    }
    if (score < 80) {
      return "留证熟练";
    }
    return "收网成精";
  }
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
      level: getDimensionLevel(dimension, score),
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
        level: getDimensionLevel(dimension, score),
      };
    });
}

function buildPosterStory(personaMeta, brainlessIndex, topDimensions) {
  const dimensionText = topDimensions.map((item) => `${item.label}${item.score}`).join(" / ");
  return `你最显眼的短剧脑回路集中在 ${dimensionText} 这几处。扔进 ${personaMeta.genres[0]} 赛道，你大概率会被剪成 ${personaMeta.roles[0]} 位：情绪先炸，判断后补，逻辑只在片尾彩蛋里短暂出现。当前脑残指数 ${brainlessIndex}，已经到了看见认亲线索都会自动坐直的程度。`;
}

function getDimensionScoreValue(dimensionRatings, dimensionName) {
  return dimensionRatings.find((item) => item.name === dimensionName)?.score ?? 50;
}

function buildDetailedAnalysis(personaMeta, brainlessIndex, topDimensions, dimensionRatings) {
  const [first, second, third] = topDimensions;
  const safe = (item, fallback) => (item ? `${item.label}${item.score}` : fallback);
  const rankingScores = rankPersonas(Object.fromEntries(dimensionRatings.map((item) => [item.name, item.score])));
  const runnerUp = rankingScores[1] ? PERSONA_LIBRARY[rankingScores[1].name] : null;
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
  const episodeEstimate = clamp(
    18
      - Math.round(brainlessIndex / 7)
      + Math.round((controlScore - 50) / 12)
      - Math.round((rageScore - 50) / 18)
      - Math.round((spectacleScore - 50) / 18)
      - Math.round((relationshipScore - 50) / 20),
    2,
    26,
  );
  let episodeOutcome = "属于还能苟到中后段、但迟早会因为自己的毛病把局面重新演炸的类型。";
  if (episodeEstimate <= 4) {
    episodeOutcome = "基本活不过前几集，不是被自己嘴快玩死，就是被人拿去做观众血压包。";
  } else if (episodeEstimate <= 8) {
    episodeOutcome = "大概能撑过开局，但很容易在第一波狗血高潮里把自己送走。";
  } else if (episodeEstimate <= 14) {
    episodeOutcome = "能混到中段，主要靠戏剧张力续命，不是靠你真的稳。";
  } else if (episodeEstimate >= 20) {
    episodeOutcome = "已经算比较能苟的了，前提是别在最关键的时候突然上头抢戏。";
  }
  const strongestTrait = first?.name ? DIMENSION_DIAGNOSTICS[first.name]?.high : "";
  const secondTrait = second?.name ? DIMENSION_DIAGNOSTICS[second.name]?.high : "";
  const preservedDimension = [...dimensionRatings]
    .sort((left, right) => {
      const leftGood = left.name === "做局清算" ? 100 - Math.abs(left.score - 85) : left.score;
      const rightGood = right.name === "做局清算" ? 100 - Math.abs(right.score - 85) : right.score;
      return rightGood - leftGood;
    })
    .find((item) => item.name === "做局清算" ? item.score >= 65 : item.score <= 35)
    || [...dimensionRatings].sort((left, right) => left.score - right.score)[0];
  const preservedText = preservedDimension
    ? (preservedDimension.name === "做局清算"
      ? DIMENSION_DIAGNOSTICS[preservedDimension.name]?.high
      : DIMENSION_DIAGNOSTICS[preservedDimension.name]?.low)
    : "你也不是完全没刹车，只是刹车常常来得太晚。";

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
    {
      title: "人格特点",
      text: `你最像 ${personaMeta.display_name}，不是因为某一题选得离谱，而是 ${safe(first, "旧情滤镜")}、${safe(second, "爆冲翻脸")}、${safe(third, "外挂吞钩")} 这几根线在你身上拧得特别紧。${strongestTrait}${secondTrait ? `再加上 ${secondTrait}` : ""}`,
    },
    {
      title: "核心缺陷",
      text: `${patternText}${triggerText}说白了，你的问题不是不知道什么叫离谱，而是每次都比该抽身的时间晚半拍，最后硬把普通矛盾养成连续剧。`,
    },
    {
      title: "还剩点啥",
      text: `${preservedText}这点东西让你不至于完全塌成纸片人，但也只够偶尔自救，远远不够把整套脑回路从狗血里拔出来。`,
    },
    {
      title: "能活几集",
      text: `按你这套脑回路，扔进 ${personaMeta.genres[0]} 赛道里大概能活 ${episodeEstimate} 集。${episodeOutcome}${finaleText}${runnerUp ? `如果不是这条线压得最狠，你本来还可能往 ${runnerUp.display_name} 那边滑。` : ""}`,
    },
  ];
}

function buildVerdictSummary(personaMeta, topDimensions, dimensionRatings) {
  const strongest = topDimensions[0];
  const strongestText = strongest?.name ? DIMENSION_DIAGNOSTICS[strongest.name]?.high : "";
  const controlScore = getDimensionScoreValue(dimensionRatings, "做局清算");
  const controlText = controlScore >= 65
    ? "好消息是你还知道留点后手，不算彻底裸奔。"
    : "坏消息是你连给自己留后手这件事都做得一般。";
  return `${personaMeta.verdict}${strongestText ? strongestText : ""}${controlText}`;
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

function renderTags(container, values, variant) {
  container.innerHTML = "";
  container.dataset.variant = variant;
  values.forEach((value, index) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    if (values.length % 2 === 1 && index === values.length - 1) {
      tag.classList.add("tag-wide");
    }
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
    `主导指数：${topDimensions.map((item) => `${item.label}${item.score}(${item.level})`).join(" / ")}`,
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
  dom.resultVerdict.textContent = buildVerdictSummary(personaMeta, topDimensions, dimensionRatings);
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
  renderTags(dom.genreTags, personaMeta.genres, "genre");
  renderTags(dom.roleTags, personaMeta.roles, "role");

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
