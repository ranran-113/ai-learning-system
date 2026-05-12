import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container-narrow flex min-h-screen flex-col justify-center py-16">
      <section className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm tracking-wide text-ink-mute">三导师 AI 学习成长系统</p>
          <h1 className="text-3xl font-medium leading-tight sm:text-4xl">
            不是让你收藏更多 AI 知识，
            <br className="hidden sm:block" />
            而是陪你真正学懂、说出来、用起来、沉淀下来。
          </h1>
        </div>

        <p className="text-base leading-relaxed text-ink-soft">
          这里有三位导师陪你持续学 AI ——
          <span className="font-medium text-ink">卡帕西</span> 帮你拆穿黑箱，
          <span className="font-medium text-ink">钱学森</span> 帮你把知识落到能做的事，
          <span className="font-medium text-ink">阿德勒</span> 在你卡住时接住你。
        </p>

        <div className="card space-y-3">
          <p className="text-sm text-ink-mute">先做一件事</p>
          <h2 className="text-xl font-medium">完成一份 15 题的联合测试</h2>
          <p className="text-sm leading-relaxed text-ink-soft">
            它不是考试，是帮我们了解你 —— 等级也不是评判，是你在地图上的位置。
            <br />
            大约 5-8 分钟。
          </p>
          <div className="pt-2">
            <Link href="/onboarding" className="btn-primary inline-block">
              开始
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/levels" className="btn-ghost">
            先看看 AI 能力 0-10 级地图
          </Link>
        </div>
      </section>

      <footer className="mt-24 text-xs text-ink-mute">
        v0.1 · MVP 本地静态版
      </footer>
    </main>
  );
}
