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
