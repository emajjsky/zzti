const QUESTION_BANK_URL = "./data/question-bank.v1.json";

const PROFILE_CONFIG = {
  quick: { core: 23, calibration: 7, antiConflict: 3, hidden: 2 },
  standard: { core: 26, calibration: 8, antiConflict: 4, hidden: 2 },
  full: { core: 32, calibration: 10, antiConflict: 5, hidden: 3 },
};

const ACTIVE_PROFILE = "full";

const DIMENSION_ORDER = [
  "上头度",
  "恋爱脑度",
  "装逼度",
  "复读度",
  "刻薄度",
  "降智度",
  "做局度",
  "掉马妄想度",
];

const BRAINLESS_WEIGHTS = {
  上头度: 0.15,
  恋爱脑度: 0.18,
  装逼度: 0.12,
  复读度: 0.14,
  刻薄度: 0.08,
  降智度: 0.2,
  做局度: -0.12,
  掉马妄想度: 0.25,
};

const PERSONA_LIBRARY = {
  接绿活佛: {
    tagline: "烂人只要一掉眼泪，你就忍不住开始给他找补。",
    verdict: "你最擅长的不是谈恋爱，是替烂剧情补锅。别人看见绿光会跑，你看见绿光会想：说不定是角度问题。",
    quote: "他爱她没关系，只要最后愿意回来，这个家我还能撑。",
    genres: ["现代女频", "都市男频", "家庭伦理"],
    roles: ["冤种赘婿", "苦主原配", "深情替身"],
    targets: { 上头度: 58, 恋爱脑度: 96, 装逼度: 25, 复读度: 38, 刻薄度: 24, 降智度: 84, 做局度: 18, 掉马妄想度: 22 },
    primary: ["恋爱脑度", "降智度"],
    secondary: ["上头度"],
  },
  歪嘴抄家: {
    tagline: "手里牌未必够，嘴里台词一定满。",
    verdict: "你的人生驱动力不是赢，而是让所有人知道你早晚会赢。哪怕底牌还没掏出来，狠话也得先开场白一样甩满。",
    quote: "三分钟，我要看到他们全家排队给我道歉。",
    genres: ["都市男频", "修仙玄幻", "古装权谋"],
    roles: ["龙王", "战神", "退婚流天才"],
    targets: { 上头度: 68, 恋爱脑度: 18, 装逼度: 96, 复读度: 20, 刻薄度: 42, 降智度: 52, 做局度: 28, 掉马妄想度: 92 },
    primary: ["装逼度", "掉马妄想度"],
    secondary: ["上头度"],
  },
  帮腔喇叭: {
    tagline: "谁喊得大声，你就替谁扩音。",
    verdict: "你不是来判断真相的，你是来把别人的情绪做成立体环绕声的。全场要是缺个帮腔位，你永远第一个补上。",
    quote: "你说得都对，我再帮你重复一遍让她听清楚。",
    genres: ["家庭伦理", "现代女频", "古装权谋"],
    roles: ["路人甲", "亲戚嘴替", "朝堂跟风官"],
    targets: { 上头度: 42, 恋爱脑度: 28, 装逼度: 18, 复读度: 95, 刻薄度: 48, 降智度: 82, 做局度: 12, 掉马妄想度: 44 },
    primary: ["复读度", "降智度"],
    secondary: ["刻薄度"],
  },
  验资门神: {
    tagline: "先验资，再验门第，最后验你配不配喘气。",
    verdict: "你对人的第一反应不是了解，是筛选。你特别擅长把偏见说得像规矩，把羞辱包装成长辈经验。",
    quote: "钱都摆不上桌，还想跟我谈尊重？",
    genres: ["现代女频", "家庭伦理", "古装权谋"],
    roles: ["恶婆婆", "丈母娘", "主母"],
    targets: { 上头度: 38, 恋爱脑度: 12, 装逼度: 44, 复读度: 40, 刻薄度: 96, 降智度: 62, 做局度: 26, 掉马妄想度: 20 },
    primary: ["刻薄度"],
    secondary: ["降智度", "复读度"],
  },
  跪舔罗盘: {
    tagline: "哪边风大你跪哪边，永远精准导航。",
    verdict: "你没有原则，但你有方向感。场上只要出现一个更强的人，你就会像指南针一样自动转过去。",
    quote: "哥你说得对，我刚才站错边了，现在我重新跪。",
    genres: ["都市男频", "古装权谋", "家庭伦理"],
    roles: ["小舅子", "狗腿秘书", "家奴跟班"],
    targets: { 上头度: 34, 恋爱脑度: 20, 装逼度: 16, 复读度: 84, 刻薄度: 58, 降智度: 76, 做局度: 18, 掉马妄想度: 18 },
    primary: ["复读度"],
    secondary: ["刻薄度", "降智度"],
  },
  掀桌疯狗: {
    tagline: "气一上头，桌子和关系都得一起飞。",
    verdict: "你处理冲突的方式不是化解，是引爆。只要那口气过不去，后果、台阶、体面都能先往后稍稍。",
    quote: "今天谁都别活，先让我把这桌掀干净。",
    genres: ["现代女频", "都市男频", "修仙玄幻"],
    roles: ["疯批女配", "暴走前任", "热血少爷"],
    targets: { 上头度: 97, 恋爱脑度: 30, 装逼度: 58, 复读度: 18, 刻薄度: 52, 降智度: 72, 做局度: 12, 掉马妄想度: 34 },
    primary: ["上头度"],
    secondary: ["装逼度", "降智度"],
  },
  录音黑莲: {
    tagline: "脸上在笑，口袋里已经按下录音键。",
    verdict: "你不急着赢第一回合，你急着赢大结局。别人靠吵，你靠留证和做局，专挑全员到齐的时候下手。",
    quote: "姐姐别急，我录着呢，等人齐了再一块听。",
    genres: ["现代女频", "古装权谋", "穿越重生"],
    roles: ["真千金", "复仇前妻", "毒士嫡女"],
    targets: { 上头度: 26, 恋爱脑度: 20, 装逼度: 34, 复读度: 18, 刻薄度: 52, 降智度: 18, 做局度: 97, 掉马妄想度: 56 },
    primary: ["做局度"],
    secondary: ["刻薄度", "掉马妄想度"],
  },
  龙王癔症: {
    tagline: "普通日子你活不进去，非得脑补成掉马现场。",
    verdict: "你不是非要解决问题，你是非要让问题长出一个‘其实我是龙王’的尾巴。没有身份反转，你会觉得戏不完整。",
    quote: "他们笑我现在，等会儿就该跪着叫我爷。",
    genres: ["都市男频", "现代女频", "修仙玄幻"],
    roles: ["真少爷", "龙王", "隐藏血脉"],
    targets: { 上头度: 48, 恋爱脑度: 18, 装逼度: 82, 复读度: 18, 刻薄度: 30, 降智度: 58, 做局度: 22, 掉马妄想度: 98 },
    primary: ["掉马妄想度"],
    secondary: ["装逼度", "降智度"],
  },
  系统走狗: {
    tagline: "没了外挂提示，你整个人就像掉线。",
    verdict: "你不是没有主见，你是把主见外包给了系统、提示框和奖励清单。奖励一响，脑子就自动下班。",
    quote: "统子别废话，直接告诉我跪哪儿能赚最多。",
    genres: ["穿越重生", "修仙玄幻", "现代女频"],
    roles: ["系统宿主", "快穿执行者", "签到工具人"],
    targets: { 上头度: 58, 恋爱脑度: 26, 装逼度: 26, 复读度: 26, 刻薄度: 18, 降智度: 94, 做局度: 22, 掉马妄想度: 72 },
    primary: ["降智度"],
    secondary: ["掉马妄想度", "上头度"],
  },
  后仰喇叭: {
    tagline: "你的人生职责就是替全场把‘卧槽’喊出来。",
    verdict: "你不一定会做事，但你特别会放大别人做出来的事。别人掉马，你负责惊呼；别人翻盘，你负责把氛围烘到天花板。",
    quote: "卧槽他真是？我就说这人不简单！",
    genres: ["现代女频", "都市男频", "古装权谋"],
    roles: ["吃瓜群众", "宫宴嘴替", "围观同事"],
    targets: { 上头度: 46, 恋爱脑度: 16, 装逼度: 18, 复读度: 82, 刻薄度: 26, 降智度: 70, 做局度: 12, 掉马妄想度: 62 },
    primary: ["复读度"],
    secondary: ["掉马妄想度", "降智度"],
  },
  装孙军师: {
    tagline: "你不是怂，你是习惯把仇算到结尾。",
    verdict: "你很清楚什么叫先活着、先苟住、先让子弹飞一会儿。别人把隐忍当窝囊，你把隐忍当复仇理财。",
    quote: "先忍到大结局，利息我一分都不会少收。",
    genres: ["古装权谋", "都市男频", "修仙玄幻"],
    roles: ["军师", "庶子", "苟王师兄"],
    targets: { 上头度: 18, 恋爱脑度: 16, 装逼度: 24, 复读度: 18, 刻薄度: 28, 降智度: 12, 做局度: 95, 掉马妄想度: 52 },
    primary: ["做局度"],
    secondary: ["上头度", "降智度"],
  },
  巴掌阎王: {
    tagline: "一巴掌一旧账，打的不是脸，是总账。",
    verdict: "你不信和解，也不爱轻拿轻放。你最上头的不是冲突本身，而是那种‘今天必须把账结完’的极端快感。",
    quote: "这一巴掌只是利息，本金我还没开始念。",
    genres: ["现代女频", "都市男频", "穿越重生"],
    roles: ["复仇女主", "狠人老板", "黑化主角"],
    targets: { 上头度: 86, 恋爱脑度: 12, 装逼度: 40, 复读度: 12, 刻薄度: 68, 降智度: 30, 做局度: 74, 掉马妄想度: 28 },
    primary: ["上头度", "做局度"],
    secondary: ["刻薄度"],
  },
  白月光免罪牌: {
    tagline: "别人犯错你审判，白月光犯错你写谅解书。",
    verdict: "你对白月光的滤镜已经不是滤镜，是特赦令。只要冠上旧爱、初恋、白月光，你的判断就会自动打折。",
    quote: "她不是故意的，她只是太重要了。",
    genres: ["现代女频", "都市男频", "穿越重生"],
    roles: ["归国白月光", "旧爱插队怪", "滤镜苦主"],
    targets: { 上头度: 42, 恋爱脑度: 90, 装逼度: 20, 复读度: 18, 刻薄度: 50, 降智度: 76, 做局度: 18, 掉马妄想度: 34 },
    primary: ["恋爱脑度"],
    secondary: ["降智度", "刻薄度"],
  },
  退婚回旋镖: {
    tagline: "你活着就为那句‘当年你看不起我’。",
    verdict: "你的人生必须先被踩脸，再在同一批人面前封神。没有退婚、看不起、回踩、跪求这套回旋镖流程，你都觉得不够爽。",
    quote: "当年你退婚，今天你排队后悔。",
    genres: ["修仙玄幻", "都市男频", "现代女频"],
    roles: ["退婚流天才", "打脸真千金", "逆袭前任"],
    targets: { 上头度: 68, 恋爱脑度: 12, 装逼度: 86, 复读度: 16, 刻薄度: 34, 降智度: 40, 做局度: 32, 掉马妄想度: 88 },
    primary: ["装逼度", "掉马妄想度"],
    secondary: ["上头度"],
  },
  萌宝军火库: {
    tagline: "你相信世界上每个大烂摊子都该靠神童幼崽收尾。",
    verdict: "在你眼里，小孩不是小孩，是黑客、法务、DNA检测仪和情感谈判专家的合体。成年人的问题，你总想靠萌宝一键通关。",
    quote: "妈咪别哭，我已经把监控和转账记录投屏了。",
    genres: ["现代女频", "都市男频", "家庭伦理"],
    roles: ["天才萌宝", "认亲雷达", "带球跑外挂"],
    targets: { 上头度: 28, 恋爱脑度: 26, 装逼度: 22, 复读度: 18, 刻薄度: 18, 降智度: 84, 做局度: 50, 掉马妄想度: 88 },
    primary: ["降智度", "掉马妄想度"],
    secondary: ["做局度"],
  },
  认亲广播站: {
    tagline: "一看到玉佩、胎记、旧照片，你嘴已经开始播报了。",
    verdict: "你不是在看线索，你是在找认亲开关。真相还没出来，你已经替全场把‘原来她才是亲生的’喊成了广播站。",
    quote: "卧槽我就知道，这人绝对不是普通路人。",
    genres: ["现代女频", "古装权谋", "家庭伦理"],
    roles: ["认亲嘴替", "宫宴起哄官", "族谱播报员"],
    targets: { 上头度: 46, 恋爱脑度: 18, 装逼度: 24, 复读度: 84, 刻薄度: 24, 降智度: 82, 做局度: 12, 掉马妄想度: 92 },
    primary: ["掉马妄想度", "复读度"],
    secondary: ["降智度"],
  },
};

const HIDDEN_LIBRARY = {
  脑残编剧: {
    title: "脑残编剧",
    copy: "你已经不满足于看离谱剧情，你开始主动给离谱剧情加码。逻辑在你这里不是底线，是可删选项。",
  },
  红果综合症患者: {
    title: "红果综合症患者",
    copy: "你的大脑已经被掉马、打脸、认亲、反转训练成了条件反射系统。现实一旦不够狗血，你会自动失落。",
  },
};

const state = {
  bank: null,
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

function buildPaper(profile = "standard") {
  const config = PROFILE_CONFIG[profile];
  const coreQuestions = state.bank.core_questions;
  const calibrationQuestions = state.bank.calibration_questions;
  const hiddenQuestions = state.bank.hidden_trigger_questions;

  const byPersona = {};
  coreQuestions.forEach((question) => {
    if (!byPersona[question.persona_id]) {
      byPersona[question.persona_id] = [];
    }
    byPersona[question.persona_id].push(question);
  });

  const selectedCore = [];
  const personaIds = shuffle(Object.keys(byPersona));
  personaIds.forEach((personaId) => {
    if (selectedCore.length < config.core) {
      selectedCore.push(shuffle(byPersona[personaId])[0]);
    }
  });

  const personaCount = {};
  selectedCore.forEach((question) => {
    personaCount[question.persona_id] = (personaCount[question.persona_id] || 0) + 1;
  });

  shuffle(coreQuestions).forEach((question) => {
    if (selectedCore.length >= config.core) {
      return;
    }
    if (selectedCore.some((item) => item.id === question.id)) {
      return;
    }
    if ((personaCount[question.persona_id] || 0) >= 4) {
      return;
    }
    selectedCore.push(question);
    personaCount[question.persona_id] = (personaCount[question.persona_id] || 0) + 1;
  });

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

  Object.keys(calibrationByDimension).forEach((dimension) => {
    if (selectedCalibration.length < config.calibration) {
      selectedCalibration.push(shuffle(calibrationByDimension[dimension])[0]);
    }
  });

  shuffle(generalCalibrationPool).forEach((question) => {
    if (selectedCalibration.length < config.calibration) {
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
    if (selectedAntiConflict.length < config.antiConflict) {
      selectedAntiConflict.push(shuffle(antiByDimension[dimension])[0]);
    }
  });

  shuffle(antiConflictPool).forEach((question) => {
    if (selectedAntiConflict.length < config.antiConflict) {
      uniquePush(selectedAntiConflict, question, (item) => item.id === question.id);
    }
  });

  const selectedHidden = [];
  const hiddenByTarget = {};
  hiddenQuestions.forEach((question) => {
    if (!hiddenByTarget[question.hidden_target]) {
      hiddenByTarget[question.hidden_target] = [];
    }
    hiddenByTarget[question.hidden_target].push(question);
  });

  Object.keys(hiddenByTarget).forEach((target) => {
    if (selectedHidden.length < config.hidden) {
      selectedHidden.push(shuffle(hiddenByTarget[target])[0]);
    }
  });

  shuffle(hiddenQuestions).forEach((question) => {
    if (selectedHidden.length < config.hidden) {
      uniquePush(selectedHidden, question, (item) => item.id === question.id);
    }
  });

  const questions = shuffle([
    ...selectedCore,
    ...selectedCalibration,
    ...selectedAntiConflict,
    ...selectedHidden,
  ]);

  return {
    profile,
    questions,
  };
}

function getProfileQuestionCount(profile) {
  const config = PROFILE_CONFIG[profile];
  return config.core + config.calibration + config.antiConflict + config.hidden;
}

function updateStartButton() {
  if (!state.bank) {
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

function getQuestionKicker(question) {
  if (question.question_type === "core") {
    return `人格锚点：${question.result_name} / ${question.metric_name}`;
  }
  if (question.question_type === "hidden_trigger") {
    return `隐藏诊断：${question.hidden_target}`;
  }
  return `维度校准：${question.dimension}`;
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
  dom.brainMeter.textContent = `脑子剩余 ${Math.max(0, 100 - Math.round(((state.currentIndex) / total) * 100))}%`;
  dom.questionGenre.textContent = question.genre || question.dimension || question.hidden_target;
  dom.questionSource.textContent = question.result_name || question.dimension || question.hidden_target;
  dom.questionKicker.textContent = getQuestionKicker(question);
  dom.questionStem.textContent = question.stem;

  dom.optionsContainer.innerHTML = "";
  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-card";
    button.type = "button";
    button.innerHTML = `<span class="option-key">${option.id}</span><span class="option-text">${option.text}</span>`;
    button.addEventListener("click", () => {
      state.answers.push({
        question,
        option,
      });
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
    if (meta.primary.includes(dimension)) {
      importance = 1.8;
    } else if (meta.secondary.includes(dimension)) {
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
  return `你的脑子最爱在 ${dimensionText} 这几处集体塌方。扔进 ${personaMeta.genres[0]} 赛道，你大概率会被剪成 ${personaMeta.roles[0]} 位：情绪先炸，判断后补，逻辑只在片尾彩蛋里短暂出现。当前脑残指数 ${brainlessIndex}，已经到了看见认亲玉佩都会自动坐直的程度。`;
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
    `诊断结论：脑子已经被短剧腌透了`,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderResult() {
  const dimensionScores = calculateDimensionScores();
  const brainlessIndex = calculateBrainlessIndex(dimensionScores);
  const personaName = pickPersona(dimensionScores);
  const personaMeta = PERSONA_LIBRARY[personaName];
  const verdictLabel = getVerdictLabel(brainlessIndex);
  const topDimensions = getTopDimensions(dimensionScores);
  const sampleCode = buildSampleCode(personaName, brainlessIndex);

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

  renderDimensionList(dimensionScores);
  renderTags(dom.genreTags, personaMeta.genres);
  renderTags(dom.roleTags, personaMeta.roles);

  dom.copyButton.onclick = async () => {
    const text = buildShareText(personaName, personaMeta, brainlessIndex);
    try {
      await navigator.clipboard.writeText(text);
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

  showSection("result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadBank() {
  try {
    const response = await fetch(QUESTION_BANK_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    state.bank = await response.json();
    updateStartButton();
    dom.loadStatus.textContent = `题库已接入：${state.bank.counts.total_questions} 题，固定发疯卷直接开测。`;
  } catch (error) {
    dom.startButton.textContent = "题库加载失败";
    dom.loadStatus.textContent = "当前站点需要通过 HTTP 或 GitHub Pages 打开，不能直接 file:// 打开。";
    console.error(error);
  }
}

function bindEvents() {
  dom.startButton.addEventListener("click", () => {
    if (!state.bank) {
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
  loadBank();
}

init();
