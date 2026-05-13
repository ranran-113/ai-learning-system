"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { lsRemove, LS_KEYS } from "@/lib/utils";
import { getCurrentUser, signOut, syncLocalToSupabase, syncSupabaseToLocal } from "@/lib/sync/sync";
import { SESSION_LS_KEYS } from "@/lib/langgraph/state";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUserEmail(u?.email || null);
      // 读最后同步时间
      try {
        const ts = localStorage.getItem("als:last-synced-at");
        if (ts) setLastSyncedAt(ts);
      } catch {}
    })();
  }, []);

  const handleSignOut = async () => {
    if (!confirm("退出登录吗？")) return;
    await signOut();
    router.refresh();
    setUserEmail(null);
  };

  const handleSync = async (direction: "push" | "pull" | "both") => {
    setSyncBusy(true);
    setSyncMsg("");
    const messages: string[] = [];
    if (direction === "push" || direction === "both") {
      const r = await syncLocalToSupabase();
      if (r.errors.length) messages.push("推送错误：" + r.errors.join("; "));
      else messages.push(`已推送：profile ${r.pushed.profile} · outputs ${r.pushed.outputs} · sessions ${r.pushed.sessions}`);
    }
    if (direction === "pull" || direction === "both") {
      const r = await syncSupabaseToLocal();
      if (r.errors.length) messages.push("拉取错误：" + r.errors.join("; "));
      else messages.push(`已拉取：profile ${r.pulled.profile ? "✓" : "—"} · outputs ${r.pulled.outputs}`);
    }
    setSyncMsg(messages.join(" | "));
    setSyncBusy(false);
    setLastSyncedAt(new Date().toISOString());
  };

  const handleResetTest = () => {
    if (!confirm("确定重新测试吗？当前的测试结果会被覆盖（云端数据保持不变,除非你登录后再同步）。")) return;
    lsRemove(LS_KEYS.TEST_ANSWERS);
    lsRemove(LS_KEYS.TEST_START_AT);
    lsRemove(LS_KEYS.TEST_RESULT);
    lsRemove(LS_KEYS.USER_LEVEL_ADJUSTED);
    router.push("/onboarding");
  };

  const handleClearLocal = () => {
    if (!confirm("清空本地缓存（不影响云端数据）？所有 localStorage 数据会丢失,但你登录后会从云端拉回。")) return;
    if (!confirm("再次确认：清空 localStorage，确定？")) return;
    Object.values(LS_KEYS).forEach((key) => lsRemove(key));
    Object.values(SESSION_LS_KEYS).forEach((key) => lsRemove(key));
    lsRemove("als:last-synced-at");
    lsRemove("als:output-history");
    router.push("/");
  };

  return (
    <LearningCenterShell current="settings" userEmail={userEmail}>
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">设置</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">账号与数据</h1>
        </div>

        {/* 账号 */}
        <div className="card space-y-3">
          <p className="text-xs uppercase tracking-wider text-ink-mute">账号</p>
          {userEmail ? (
            <>
              <p className="text-base">
                <span className="font-medium">{userEmail}</span>
              </p>
              <p className="text-xs text-ink-soft">通过 magic link 登录,数据已在云端备份。</p>
              <button onClick={handleSignOut} className="btn-ghost text-sm">
                退出登录
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft">还没登录。当前数据只存在这个浏览器里,清缓存就丢。</p>
              <Link href="/login" className="btn-primary inline-block text-sm">
                邮箱登录
              </Link>
            </>
          )}
        </div>

        {/* 数据同步 */}
        <div className="card space-y-3">
          <p className="text-xs uppercase tracking-wider text-ink-mute">数据同步</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            登录后,你的测试结果、学习会话、输出沉淀都会同步到云端。
            {lastSyncedAt && (
              <span className="block text-xs text-ink-mute">
                上次同步：{new Date(lastSyncedAt).toLocaleString("zh-CN")}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSync("push")}
              disabled={!userEmail || syncBusy}
              className="rounded border border-ink-mute/30 px-3 py-1.5 text-xs hover:bg-bg-subtle disabled:opacity-50"
            >
              本地 → 云端
            </button>
            <button
              onClick={() => handleSync("pull")}
              disabled={!userEmail || syncBusy}
              className="rounded border border-ink-mute/30 px-3 py-1.5 text-xs hover:bg-bg-subtle disabled:opacity-50"
            >
              云端 → 本地
            </button>
            <button
              onClick={() => handleSync("both")}
              disabled={!userEmail || syncBusy}
              className="rounded border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              双向同步
            </button>
          </div>
          {syncMsg && <p className="text-xs text-ink-soft">{syncMsg}</p>}
        </div>

        {/* 重新测试 */}
        <div className="card space-y-3">
          <p className="text-xs uppercase tracking-wider text-ink-mute">重新评估</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            如果你觉得状态变了 / 测试答得不准 / 想看看更新后的等级,可以重做联合测试。
          </p>
          <button onClick={handleResetTest} className="btn-ghost text-sm">
            重新测试
          </button>
        </div>

        {/* 危险区 */}
        <div className="card space-y-3 border-accent/30">
          <p className="text-xs uppercase tracking-wider text-accent">危险操作</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            清空本地缓存。云端数据不受影响,登录后会自动拉回。如果你只想"重新测试",用上面的按钮就行,**不需要**清空。
          </p>
          <button
            onClick={handleClearLocal}
            className="rounded border border-accent/50 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
          >
            清空本地缓存
          </button>
        </div>

        <p className="text-xs leading-relaxed text-ink-mute">
          API key、隐私协议、通知偏好等高级设置将在 v0.2 加入。
        </p>
      </section>
    </LearningCenterShell>
  );
}
