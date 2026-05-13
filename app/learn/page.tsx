"use client";

// /learn —— 独立沉浸学习路由。
// v0.1.6 重构:统一使用 LearningChat 组件(全屏模式),与 /profile 共享 chat 主体。
// 这个路由保留是为了:
// - 通过 /learn?lesson=Lx 直链特定课程
// - 通过 /learn?source=hot_item&id=xxx 进入热点学习
// - 后续支持 /learn?source=material&id=xxx 上传资料学习
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { lsGet, LS_KEYS } from "@/lib/utils";
import { recommendFirstLesson, getLessonById } from "@/lib/courses/built-in-courses";
import type { TestResult } from "@/types/profile";
import { LearningChat, type SourceInfo } from "@/components/learning-chat";
import type { BuiltInLesson } from "@/types/lesson";
import type { HotItem } from "@/lib/hot/client";

// 把热点条目构造成合成 lesson
function buildSyntheticLessonFromHot(item: HotItem): BuiltInLesson {
  const shortTitle = item.title.length > 40 ? item.title.slice(0, 40) + "…" : item.title;
  return {
    id: `hot-${item.id}`,
    courseId: "ai-hot",
    title: item.title,
    category: "hot",
    targetLevelMin: 3,
    targetLevelMax: 7,
    defaultMentor: ["karpathy", "qian"],
    summary: item.summary,
    keyConcepts: ["是什么", "解决什么问题", "和已知什么相似 / 不同", "对 AIPM 的启发"],
    socraticQuestions: [
      `「${shortTitle}」—— 你第一眼看到这个，最想问的是什么？`,
      `这个东西要解决的问题，和你已经知道的什么很像？`,
      `如果你做 AI 产品，这条热点对你有什么具体启发？`,
    ],
    outputTask: `用一句话写下：「${shortTitle}」对你最有启发的一点`,
    extensionRoadmap: [],
  };
}

async function loadSourceInfo(
  searchParams: URLSearchParams,
  testResult: TestResult
): Promise<SourceInfo | null> {
  const source = searchParams.get("source");
  const id = searchParams.get("id");
  const lessonParam = searchParams.get("lesson");

  if (source === "hot_item" && id) {
    try {
      const res = await fetch(`/api/hot?limit=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const item: HotItem | undefined = data.items?.find((x: HotItem) => x.id === id);
      if (!item) return null;
      return {
        lesson: buildSyntheticLessonFromHot(item),
        sourceLabel: "热点学习",
        backHref: `/hot/${encodeURIComponent(id)}`,
        backLabel: "← 回热点",
      };
    } catch {
      return null;
    }
  }

  if (source === "material" && id) {
    // v0.1.6: 用户上传资料存在 localStorage,直接读
    const { getMaterialById } = await import("@/lib/materials/store");
    const material = getMaterialById(id);
    if (!material) return null;
    return {
      lesson: material.syntheticLesson,
      sourceLabel: "我的资料",
      backHref: "/materials",
      backLabel: "← 资料列表",
    };
  }

  if (source === "textbook" && id) {
    // 形如 ai-c01 / aipm-c03
    const [bookId, chapterId] = id.split("-");
    if (bookId !== "ai" && bookId !== "aipm") return null;
    const { getOutline } = await import("@/lib/textbooks/registry");
    const { loadChapter } = await import("@/lib/textbooks/loader");
    const outline = getOutline(bookId, chapterId);
    if (!outline) return null;
    const content = await loadChapter(bookId, chapterId);
    if (!content) return null;
    return {
      lesson: {
        id: `textbook-${id}`,
        courseId: bookId === "ai" ? "ai-textbook" : "aipm-textbook",
        title: content.title,
        category: bookId === "ai" ? "ai_tech" : "aipm",
        targetLevelMin: outline.targetLevelMin,
        targetLevelMax: outline.targetLevelMax,
        defaultMentor: content.defaultMentor,
        summary: outline.description,
        keyConcepts: content.keyConcepts,
        socraticQuestions: content.socraticQuestions,
        outputTask: content.outputTask,
        extensionRoadmap: [],
        tutorialContent: content.markdown,
      },
      sourceLabel: bookId === "ai" ? "AI 通识教材" : "AIPM 教材",
      backHref: `/textbooks/${bookId}/${chapterId}`,
      backLabel: "← 回到教材",
    };
  }

  if (source === "paper" && id) {
    // v0.1.6.1: 论文导读 —— 用 curated paper 合成 lesson
    const { getPaperById, CATEGORY_LABELS } = await import("@/lib/papers/papers");
    const paper = getPaperById(id);
    if (!paper) return null;
    const syntheticLesson = {
      id: `paper-${paper.id}`,
      courseId: "papers",
      title: paper.title,
      category: "paper" as const,
      targetLevelMin: paper.difficulty === "intro" ? 2 : paper.difficulty === "intermediate" ? 4 : 6,
      targetLevelMax: paper.difficulty === "intro" ? 5 : paper.difficulty === "intermediate" ? 7 : 9,
      defaultMentor: paper.recommendedMentor,
      summary: paper.keyContribution,
      keyConcepts: [
        "这篇论文解决了什么具体问题",
        "核心方法 / 关键创新",
        "为什么这件事重要（对行业 / 对 AIPM）",
        "我们能拿来用在什么场景",
      ],
      socraticQuestions: [
        `「${paper.title}」—— 看到题目你会预期它在解决什么问题?`,
        `${paper.keyContribution} —— 这句话里哪个词你最不确定它具体指什么?`,
        `如果你做 AI 产品,这篇论文对你最有用的一点是什么?`,
      ],
      outputTask: `用一句话写下:「${paper.title}」对你的 AI 产品工作最有启发的一点`,
      extensionRoadmap: [],
      tutorialContent: `# ${paper.title}\n\n**作者**: ${paper.authors} · **${paper.year}** · ${paper.org}\n**类别**: ${CATEGORY_LABELS[paper.category]}\n\n## 一句话核心贡献\n\n${paper.keyContribution}\n\n## 摘要\n\n${paper.abstractZh}\n\n## 为什么 AIPM 该读\n\n${paper.whyAipm}\n\n---\n\n**原文链接**: ${paper.arxivUrl || paper.paperUrl}`,
    };
    return {
      lesson: syntheticLesson,
      sourceLabel: "论文导读",
      backHref: `/papers/${encodeURIComponent(paper.id)}`,
      backLabel: "← 论文详情",
    };
  }

  const resolvedId = lessonParam || recommendFirstLesson(testResult.aiLevel.level, testResult.recommendedPath);
  const lesson = getLessonById(resolvedId);
  if (!lesson) return null;
  return {
    lesson,
    sourceLabel: "课程",
    backHref: "/profile",
    backLabel: "← 学习中心",
  };
}

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const tr = lsGet<TestResult>(LS_KEYS.TEST_RESULT);
    if (!tr) {
      router.replace("/onboarding");
      return;
    }
    setTestResult(tr);
    (async () => {
      const info = await loadSourceInfo(searchParams, tr);
      if (!info) {
        setLoadError("找不到对应的学习内容");
        setLoading(false);
        return;
      }
      setSourceInfo(info);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-mute">加载中…</p>
      </main>
    );
  }

  if (loadError || !sourceInfo || !testResult) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="card max-w-md space-y-3 text-center">
          <p className="text-sm font-medium">无法开始这节学习</p>
          <p className="text-sm text-ink-soft">{loadError || "找不到对应内容"}</p>
          <div className="flex justify-center gap-2 pt-2">
            <Link href="/profile" className="btn-ghost text-sm">回学习中心</Link>
            <Link href="/courses" className="btn-primary text-sm">看课程</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-narrow py-6">
      <div className="mb-3 flex items-center gap-3 text-sm">
        {sourceInfo.backHref && (
          <Link href={sourceInfo.backHref} className="text-ink-mute hover:text-ink-soft">
            {sourceInfo.backLabel || "← 返回"}
          </Link>
        )}
      </div>
      <LearningChat
        testResult={testResult}
        sourceInfo={sourceInfo}
        fullScreen
        onSessionEnd={() => router.push("/profile")}
      />
    </main>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-ink-mute">加载中…</p>
        </main>
      }
    >
      <LearnPageInner />
    </Suspense>
  );
}
