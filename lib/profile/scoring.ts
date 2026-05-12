// AI 能力等级 + 学习人格画像评分算法。详见 TECH.md §19-20。
import type {
  LevelResult,
  ProfileType,
  ProfileDimensions,
  LearningProfile,
  PacePreference,
  BlockerType,
  SourceType,
  TestResult,
} from "@/types/profile";
import type { TestQuestion, TestAnswersMap } from "@/types/test";
import { LEVEL_NAMES, LEVEL_NEXT_CAPABILITY } from "@/types/profile";
import { TEST_QUESTIONS } from "./test-questions";

// ============= 关键参数 =============
const MIN_EVIDENCE = 3;
const PREREQ_RATIO = 0.4;
const PREREQ_FLOOR = MIN_EVIDENCE * PREREQ_RATIO; // = 1.2
const LOW_CONFIDENCE_THRESHOLD = 0.3;

// ============= 工具函数 =============
function sumValues(scores: Record<number, number>): number {
  return Object.values(scores).reduce((a, b) => a + b, 0);
}

function hasPrerequisiteEvidence(L: number, scores: Record<number, number>): boolean {
  if (L === 0 || L === 1) return true;
  return (scores[L - 1] || 0) >= PREREQ_FLOOR || (scores[L - 2] || 0) >= PREREQ_FLOOR;
}

// ============= AI 等级评分（核心算法） =============
export function calculateAILevel(
  answers: TestAnswersMap,
  conflictPairs?: Array<{ low: string; high: string }>
): LevelResult {
  // 1. 累计 levelScores
  const levelScores: Record<number, number> = {};
  for (let L = 0; L <= 10; L++) levelScores[L] = 0;

  for (const question of TEST_QUESTIONS) {
    if (question.questionCategory !== "level") continue;
    const selectedIds = answers[question.id] || [];
    for (const optionId of selectedIds) {
      const option = question.options.find((o) => o.id === optionId);
      if (!option?.levelIndicators) continue;
      for (const ind of option.levelIndicators) {
        levelScores[ind.level] = (levelScores[ind.level] || 0) + ind.weight;
      }
    }
  }

  const totalWeight = sumValues(levelScores);

  // 兜底 1: 无任何证据
  if (totalWeight === 0) {
    return buildLevelResult(0, 0, levelScores, undefined, {
      evidenceConflict: false,
      conflictPairs,
    });
  }

  // 兜底 2: 证据太少
  if (totalWeight < 5) {
    return buildLevelResult(1, 0.2, levelScores, "证据不足，已默认为 Lv.1，建议重测", {
      evidenceConflict: false,
      conflictPairs,
    });
  }

  // 兜底 3: 全 0 偏选（用户全选 A "没用过 AI"）
  const nonZeroOnly = Object.entries(levelScores).every(
    ([L, w]) => Number(L) === 0 || w === 0
  );
  if (nonZeroOnly && levelScores[0] >= MIN_EVIDENCE) {
    return buildLevelResult(0, 1.0, levelScores, undefined, {
      evidenceConflict: false,
      conflictPairs,
    });
  }

  // 1. 证据加权中心
  const centerOfMass =
    Object.entries(levelScores).reduce((s, [L, w]) => s + Number(L) * w, 0) / totalWeight;

  // 2. 从高往低扫，找候选最高等级
  let candidate = 0;
  for (let L = 10; L >= 0; L--) {
    if (levelScores[L] >= MIN_EVIDENCE) {
      candidate = L;
      break;
    }
  }

  // 3. 前置技能门槛
  while (candidate > 2 && !hasPrerequisiteEvidence(candidate, levelScores)) {
    candidate--;
  }
  // 降到 0/1 时再检查证据
  if (candidate <= 1 && levelScores[0] > levelScores[1] && levelScores[0] >= MIN_EVIDENCE) {
    candidate = 0;
  } else if (candidate <= 1 && (levelScores[1] || 0) >= MIN_EVIDENCE) {
    candidate = 1;
  }

  // 4. 用证据中心做上限
  const ceiling = Math.floor(centerOfMass + 1.5);
  candidate = Math.min(candidate, Math.max(0, ceiling));

  // 5. Lv.10 特殊保护
  if (candidate === 10) {
    const lv10Confidence =
      ((levelScores[10] || 0) + (levelScores[9] || 0)) / totalWeight;
    if (lv10Confidence < 0.7) candidate = 9;
  }

  // 6. 计算置信度
  const inRange =
    (levelScores[Math.max(0, candidate - 1)] || 0) +
    levelScores[candidate] +
    (levelScores[Math.min(10, candidate + 1)] || 0);
  const confidence = inRange / totalWeight;

  return buildLevelResult(candidate, confidence, levelScores, undefined, {
    centerOfMass,
    evidenceConflict: !!conflictPairs?.length,
    conflictPairs,
  });
}

function buildLevelResult(
  level: number,
  confidence: number,
  evidenceProfile: Record<number, number>,
  note: string | undefined,
  extra: {
    centerOfMass?: number;
    evidenceConflict?: boolean;
    conflictPairs?: Array<{ low: string; high: string }>;
  }
): LevelResult {
  const nextLevel = Math.min(10, level + 1);
  return {
    level,
    levelName: LEVEL_NAMES[level] || "未知",
    confidence: Math.min(1, Math.max(0, confidence)),
    rangeMin: Math.max(0, level - 1),
    rangeMax: Math.min(10, level + 1),
    centerOfMass: extra.centerOfMass ?? level,
    evidenceProfile,
    nextLevelTarget: {
      level: nextLevel,
      levelName: LEVEL_NAMES[nextLevel] || "已达最高级",
      requiredCapability: LEVEL_NEXT_CAPABILITY[level] || "继续探索",
    },
    evidenceConflict: extra.evidenceConflict,
    conflictPairs: extra.conflictPairs,
    suspiciousAnswer: note ? false : undefined,
  };
}

// ============= 冲突检测 =============
// Q6 多选里同时选了 A (Lv.0) 和 H/I/J/K (Lv.7+) 算冲突
export function detectConflicts(answers: TestAnswersMap): Array<{ low: string; high: string }> {
  const conflicts: Array<{ low: string; high: string }> = [];
  const q6 = answers["Q6"] || [];
  const hasNone = q6.includes("Q6-A");
  const highIndicators = ["Q6-H", "Q6-I", "Q6-J", "Q6-K"].filter((id) => q6.includes(id));
  if (hasNone && highIndicators.length > 0) {
    conflicts.push({ low: "Q6-A", high: highIndicators[0] });
  }
  return conflicts;
}

// ============= 学习人格画像 =============
export function calculateLearningProfile(answers: TestAnswersMap): LearningProfile {
  const dims = {
    anxiety: 0,
    selfBlame: 0,
    outputWillingness: 0,
    persistence: 0,
  };
  let pace: PacePreference = "uncertain";

  for (const question of TEST_QUESTIONS) {
    if (question.questionCategory !== "profile") continue;
    const selectedIds = answers[question.id] || [];
    for (const optionId of selectedIds) {
      const option = question.options.find((o) => o.id === optionId);
      if (!option) continue;
      if (option.profileImpacts) {
        for (const impact of option.profileImpacts) {
          dims[impact.dimension] += impact.delta;
        }
      }
      if (option.paceValue) pace = option.paceValue;
    }
  }

  // 维度规范化到 0-10 区间用于展示（内部计算还是原始 delta 累计）
  const clamp = (v: number) => Math.max(0, Math.min(10, v));
  const dimensions: ProfileDimensions = {
    anxiety: clamp(dims.anxiety),
    selfBlame: clamp(dims.selfBlame),
    outputWillingness: clamp(dims.outputWillingness),
    persistence: clamp(dims.persistence),
    pacePreference: pace,
  };

  return {
    type: classifyProfile(dimensions),
    dimensions,
  };
}

function classifyProfile(d: ProfileDimensions): ProfileType {
  if (d.anxiety >= 7 && d.persistence <= 4) return "信息过载型";
  if (d.selfBlame >= 7 && d.outputWillingness <= 4) return "完美主义自责型";
  if (d.persistence <= 3) return "断更型";
  return "稳定成长型";
}

// ============= mentor mix 计算 =============
const MENTOR_BASELINE: Record<ProfileType, { karpathy: number; qian: number; adler: number }> = {
  信息过载型: { karpathy: 30, qian: 20, adler: 50 },
  完美主义自责型: { karpathy: 25, qian: 25, adler: 50 },
  断更型: { karpathy: 35, qian: 25, adler: 40 },
  稳定成长型: { karpathy: 40, qian: 40, adler: 20 },
};

function applyBlockerAdjustment(
  baseline: { karpathy: number; qian: number; adler: number },
  blocker: BlockerType
): { karpathy: number; qian: number; adler: number } {
  const adj = { ...baseline };
  switch (blocker) {
    case "information_overload":
      adj.adler += 5;
      adj.karpathy -= 5;
      break;
    case "knowledge_application":
      adj.qian += 10;
      adj.karpathy -= 5;
      adj.adler -= 5;
      break;
    case "persistence":
    case "output_fear":
    case "anxiety":
      adj.adler += 10;
      adj.karpathy -= 5;
      adj.qian -= 5;
      break;
    case "motivation":
      adj.qian += 10;
      adj.karpathy -= 5;
      adj.adler -= 5;
      break;
  }
  // 确保总和 = 100，最小值 = 10
  return normalizeMentorMix(adj);
}

function normalizeMentorMix(mix: { karpathy: number; qian: number; adler: number }) {
  const min = 10;
  const clamped = {
    karpathy: Math.max(min, mix.karpathy),
    qian: Math.max(min, mix.qian),
    adler: Math.max(min, mix.adler),
  };
  const total = clamped.karpathy + clamped.qian + clamped.adler;
  return {
    karpathy: Math.round((clamped.karpathy / total) * 100),
    qian: Math.round((clamped.qian / total) * 100),
    adler: Math.round((clamped.adler / total) * 100),
  };
}

// ============= 节奏建议 =============
const PACE_RECOMMENDATION_BY_TYPE: Record<ProfileType, string> = {
  信息过载型: "每天 10 分钟，稳定一个月",
  完美主义自责型: "每天 15 分钟，每周 4 次",
  断更型: "每周 2-3 次，每次 20-30 分钟",
  稳定成长型: "每天 20-30 分钟",
};

const PACE_OVERRIDE_BY_PREFERENCE: Partial<Record<PacePreference, string>> = {
  weekly_medium: "每周 2-3 次，每次 30-60 分钟",
  weekend_burst: "周末集中学，工作日复习",
  interest_driven: "兴趣驱动，无强制节奏（系统会在你 7 天没学时温柔召回）",
};

function getPaceRecommendation(profile: LearningProfile): string {
  // 如果用户偏好明确，且和类型基线不冲突，用偏好
  const override = PACE_OVERRIDE_BY_PREFERENCE[profile.dimensions.pacePreference];
  if (override) return override;
  return PACE_RECOMMENDATION_BY_TYPE[profile.type];
}

// ============= 下一步行动建议 =============
function getNextActionText(blocker: BlockerType, level: number): string {
  const base: Record<BlockerType, string> = {
    information_overload: "今天只看一节微课的标题和 3 个核心概念，5 分钟就好",
    knowledge_application: "选一个真实任务，今天用 AI 帮你做出半成品",
    persistence: "今天只学 5 分钟，把启动门槛降到最低",
    output_fear: "今天的输出任务只要一句话，不用完美",
    anxiety: "先深呼吸三次，再点开第一节课。学不学完都没关系",
    motivation: "想一个你最讨厌的重复工作。今天看看 AI 能不能帮你少做一半",
  };
  return base[blocker];
}

// ============= 主入口 =============
export function generateTestResult(
  answers: TestAnswersMap,
  durationSeconds: number
): TestResult {
  // 冲突检测
  const conflictPairs = detectConflicts(answers);

  // AI 等级
  const aiLevel = calculateAILevel(answers, conflictPairs.length > 0 ? conflictPairs : undefined);

  // 学习人格
  const learningProfile = calculateLearningProfile(answers);

  // Q13 / Q14 / Q15
  const q13 = answers["Q13"]?.[0];
  const q14 = answers["Q14"]?.[0];
  const q15 = answers["Q15"]?.[0];

  const q13Option = TEST_QUESTIONS.find((q) => q.id === "Q13")?.options.find((o) => o.id === q13);
  const q14Option = TEST_QUESTIONS.find((q) => q.id === "Q14")?.options.find((o) => o.id === q14);
  const q15Option = TEST_QUESTIONS.find((q) => q.id === "Q15")?.options.find((o) => o.id === q15);

  const recommendedPath = q13Option?.pathRecommendation || "AI 技术基础 + AIPM 入门";
  const preferredSourceType: SourceType = q14Option?.sourceTypePreference || "built_in_course";
  const currentBlocker: BlockerType = q15Option?.blockerValue || "information_overload";

  // mentor mix
  const baseline = MENTOR_BASELINE[learningProfile.type];
  const mentorMix = applyBlockerAdjustment(baseline, currentBlocker);

  // 节奏
  const paceRecommendation = getPaceRecommendation(learningProfile);

  // 下一步行动
  const nextAction = getNextActionText(currentBlocker, aiLevel.level);

  // 答题异常标记
  const suspiciousAnswer = durationSeconds < 60;

  return {
    learningProfile,
    aiLevel: { ...aiLevel, suspiciousAnswer },
    currentBlocker,
    recommendedPath,
    preferredSourceType,
    mentorMix,
    paceRecommendation,
    nextAction,
    answeredAt: new Date().toISOString(),
    durationSeconds,
  };
}
