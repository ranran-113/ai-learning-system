"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || status === "sending") return;

    setStatus("sending");
    setErrorMsg("");
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      setStatus("error");
      setErrorMsg(msg);
    }
  };

  return (
    <main className="container-narrow flex min-h-screen flex-col justify-center py-16">
      <div className="space-y-6">
        <Link href="/profile" className="text-sm text-ink-mute hover:text-ink-soft">
          ← 学习中心
        </Link>

        <div className="space-y-2">
          <p className="text-sm tracking-wide text-ink-mute">保存你的进度</p>
          <h1 className="text-3xl font-medium leading-snug sm:text-4xl">
            留个邮箱，
            <br />
            你下次回来还在这里。
          </h1>
          <p className="text-base leading-relaxed text-ink-soft">
            我们会给你发一封登录邮件，点里面的链接就行。
            <br />
            不用记密码，不用注册流程。
          </p>
        </div>

        {status === "sent" ? (
          <div className="card space-y-3">
            <p className="text-base font-medium">登录链接已发到 {email}</p>
            <p className="text-sm leading-relaxed text-ink-soft">
              检查邮箱（包括「垃圾邮件」/「广告邮件」文件夹）。
              <br />
              链接 1 小时内有效。点链接后会自动回到这里。
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
              className="btn-ghost text-sm"
            >
              换个邮箱
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm text-ink-soft">你的邮箱</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="你@example.com"
                required
                disabled={status === "sending"}
                className="w-full rounded-lg border border-bg-warm/70 bg-white/60 px-3 py-2.5 text-sm focus:border-accent/40 focus:outline-none disabled:opacity-50"
              />
            </label>
            {status === "error" && (
              <p className="text-xs text-accent">出错了：{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={!email.includes("@") || status === "sending"}
              className="btn-primary w-full"
            >
              {status === "sending" ? "发送中…" : "发送登录链接"}
            </button>
          </form>
        )}

        <p className="text-xs leading-relaxed text-ink-mute">
          我们只用邮箱来登录和找回你的进度。不发推送，不卖给广告商。
          <br />
          数据可以随时在「学习中心」清空。
        </p>
      </div>
    </main>
  );
}
