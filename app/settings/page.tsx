"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LearningCenterShell } from "@/components/learning-center-shell";
import { lsRemove, LS_KEYS } from "@/lib/utils";
import { getCurrentUser, signOut, syncLocalToSupabase, syncSupabaseToLocal } from "@/lib/sync/sync";
import { SESSION_LS_KEYS } from "@/lib/langgraph/state";
import {
  getLearningPreferences,
  saveLearningPreferences,
  DEFAULT_PREFERENCES,
  type LearningPreferences,
} from "@/lib/preferences/preferences";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<LearningPreferences>(DEFAULT_PREFERENCES);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUserEmail(u?.email || null);
      try {
        const ts = localStorage.getItem("als:last-synced-at");
        if (ts) setLastSyncedAt(ts);
      } catch {}
    })();
    setPrefs(getLearningPreferences());
  }, []);

  const updatePref = <K extends keyof LearningPreferences>(key: K, value: LearningPreferences[K]) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveLearningPreferences(next);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 1500);
  };

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

        {/* 学习偏好 */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-ink-mute">学习偏好</p>
            {prefsSaved && <span className="text-xs text-moss">✓ 已保存</span>}
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">
            这些偏好会传给三位导师，影响他们怎么跟你说话。改完即时生效，不用点保存。
          </p>

          <PreferenceRadio
            label="学新概念时,你更喜欢"
            value={prefs.learningStyle}
            onChange={(v) => updatePref("learningStyle", v)}
            options={[
              { value: "example_first", label: "先看具体例子 / 类比" },
              { value: "abstract_first", label: "先听抽象框架 / 定义" },
              { value: "balanced", label: "平衡（默认）" },
            ]}
          />

          <PreferenceRadio
            label="讲解深度"
            value={prefs.explanationDepth}
            onChange={(v) => updatePref("explanationDepth", v)}
            options={[
              { value: "minimal", label: "精简到位,不淹没我" },
              { value: "balanced", label: "平衡（默认）" },
              { value: "deep", label: "深挖细节,我想弄透" },
            ]}
          />

          <PreferenceRadio
            label="温度 / 鼓励"
            value={prefs.encouragementLevel}
            onChange={(v) => updatePref("encouragementLevel", v)}
            options={[
              { value: "minimal", label: "克制专业,别给我加油" },
              { value: "balanced", label: "平衡（默认）" },
              { value: "warm", label: "温暖陪伴感,偶尔认可一下" },
            ]}
          />

          <div className="space-y-1.5">
            <label className="text-xs text-ink-mute">额外指令（任何你想让导师注意的事）</label>
            <textarea
              value={prefs.customInstructions}
              onChange={(e) => updatePref("customInstructions", e.target.value)}
              rows={3}
              placeholder={'例如:我是医疗背景,讨论时可以多举医疗案例 / 我做工业 PM,关注 to B 角度 / 不要用「赋能」这种词'}
              className="w-full resize-y rounded-lg border border-bg-warm/70 bg-white/60 p-3 text-sm focus:border-accent/40 focus:outline-none"
            />
          </div>

          {prefs.updatedAt && (
            <p className="text-xs text-ink-mute">上次更新：{new Date(prefs.updatedAt).toLocaleString("zh-CN")}</p>
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

function PreferenceRadio<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-ink-mute">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              value === opt.value
                ? "border-accent bg-accent text-white"
                : "border-bg-warm/70 text-ink-soft hover:bg-bg-subtle"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
