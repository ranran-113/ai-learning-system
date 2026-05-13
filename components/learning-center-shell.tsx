"use client";

// 学习中心 Shell —— 左右布局（桌面） / 顶部导航（移动）的统一外壳
// 用法：把每个"学习中心"下的页面（profile / courses / hot / records / levels / materials / settings）
//      包在这个 Shell 里,它负责导航 + 用户信息展示。
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser, signOut } from "@/lib/sync/sync";

export type NavKey = "home" | "courses" | "hot" | "materials" | "records" | "levels" | "settings";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "学习中心", href: "/profile", icon: "🏠" },
  { key: "courses", label: "课程中心", href: "/courses", icon: "📚" },
  { key: "hot", label: "AI 热点学习舱", href: "/hot", icon: "🔥" },
  { key: "materials", label: "上传资料", href: "/materials", icon: "📄" },
  { key: "records", label: "学习记录", href: "/records", icon: "🌱" },
  { key: "levels", label: "能力地图", href: "/levels", icon: "🗺" },
];

const FOOTER_ITEMS: NavItem[] = [
  { key: "settings", label: "设置", href: "/settings", icon: "⚙" },
];

export function LearningCenterShell({
  current,
  userEmail: userEmailProp,
  children,
}: {
  current: NavKey;
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalEmail, setInternalEmail] = useState<string | null>(null);

  // 如果 caller 没传 userEmail,shell 自己拉
  useEffect(() => {
    if (userEmailProp !== undefined) return;
    (async () => {
      const u = await getCurrentUser();
      setInternalEmail(u?.email || null);
    })();
  }, [userEmailProp]);

  const userEmail = userEmailProp !== undefined ? userEmailProp : internalEmail;

  const handleSignOut = async () => {
    if (!confirm("退出登录吗？你的数据已存在云端,下次登录还会回来。")) return;
    await signOut();
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* 移动端顶栏 */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-bg-warm/60 bg-bg px-4 py-3 md:hidden">
        <Link href="/profile" className="text-sm font-medium">
          三导师 AI 学习
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-md border border-bg-warm/70 px-3 py-1 text-sm text-ink-soft"
          aria-label="打开菜单"
        >
          菜单
        </button>
      </header>

      {/* 桌面端左侧导航 */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-bg-warm/60 bg-bg-subtle/30 md:flex md:flex-col">
        <div className="border-b border-bg-warm/60 p-4">
          <Link href="/" className="block text-sm font-medium leading-tight">
            三导师 AI 学习
          </Link>
          {userEmail && (
            <p
              className="mt-1 truncate text-xs text-ink-mute"
              title={userEmail}
            >
              {userEmail}
            </p>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.key} item={item} active={current === item.key} />
          ))}
        </nav>
        <div className="space-y-0.5 border-t border-bg-warm/60 p-3">
          {FOOTER_ITEMS.map((item) => (
            <NavLink key={item.key} item={item} active={current === item.key} />
          ))}
          {userEmail ? (
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-soft transition hover:bg-bg-warm/40"
            >
              <span className="text-base">⤴</span>
              <span>退出登录</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-accent transition hover:bg-accent/10"
            >
              <span className="text-base">→</span>
              <span>邮箱登录</span>
            </Link>
          )}
        </div>
      </aside>

      {/* 移动端 drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 flex h-full w-72 flex-col bg-bg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-bg-warm/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">三导师 AI 学习</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-ink-mute hover:text-ink-soft">
                  ✕
                </button>
              </div>
              {userEmail && (
                <p
                  className="mt-1 truncate text-xs text-ink-mute"
                  title={userEmail}
                >
                  {userEmail}
                </p>
              )}
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  item={item}
                  active={current === item.key}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="space-y-0.5 border-t border-bg-warm/60 p-3">
              {FOOTER_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  item={item}
                  active={current === item.key}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
              {userEmail ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-bg-warm/40"
                >
                  <span className="text-base">⤴</span>
                  <span>退出登录</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-accent hover:bg-accent/10"
                >
                  <span className="text-base">→</span>
                  <span>邮箱登录</span>
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
        active
          ? "bg-accent text-white"
          : "text-ink-soft hover:bg-bg-warm/40 hover:text-ink"
      )}
    >
      <span className="text-base">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}
