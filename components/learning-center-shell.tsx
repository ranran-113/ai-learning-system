"use client";

// 学习中心 Shell —— v0.4 v2.0 重写
// 侧边栏从 v0.x 的 8 平铺项,改为 v2.0 的 4 分组(学习线 / 持续学习 / 资产 / 系统)
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser, signOut } from "@/lib/sync/sync";

export type NavKey =
  // 主页
  | "home"
  // 学习线
  | "line-ai"
  | "line-aipm"
  | "line-tools"
  | "line-job"
  // 持续学习
  | "hot"
  | "papers"
  | "github"
  | "blogs"
  // 资产 + 系统
  | "notes"
  | "settings"
  | "levels"
  | "materials"
  | "records"
  // v0.x 兼容入口
  | "courses"
  | "textbooks";

type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: string;
  // 状态:available = 已可用 / soon = 占位(显示但灰)
  status?: "available" | "soon";
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

// v2.0 新侧边栏结构 —— 4 分组
const NAV_GROUPS: NavGroup[] = [
  {
    title: "", // 首页不分组
    items: [{ key: "home", label: "首页", href: "/profile", icon: "🏠" }],
  },
  {
    title: "学习线",
    items: [
      { key: "line-ai", label: "AI 通识", href: "/learn/ai", icon: "🧠" },
      { key: "line-aipm", label: "AIPM", href: "/learn/aipm", icon: "💼" },
      { key: "line-tools", label: "AI 工具", href: "/learn/tools", icon: "🛠", status: "soon" },
      { key: "line-job", label: "AIPM 求职", href: "/learn/aipm-job", icon: "🎯", status: "soon" },
    ],
  },
  {
    title: "持续学习",
    items: [
      { key: "hot", label: "AI 热点", href: "/hot", icon: "🔥" },
      { key: "papers", label: "论文导读", href: "/papers", icon: "📄" },
      { key: "github", label: "GitHub 周榜", href: "/github-weekly", icon: "📊", status: "soon" },
      { key: "blogs", label: "博客 / 访谈", href: "/blogs", icon: "📝", status: "soon" },
    ],
  },
  {
    title: "资产",
    items: [
      { key: "notes", label: "我的笔记", href: "/records", icon: "💎" },
      { key: "materials", label: "上传资料", href: "/materials", icon: "📤" },
    ],
  },
];

const FOOTER_ITEMS: NavItem[] = [
  { key: "levels", label: "能力地图", href: "/levels", icon: "🗺" },
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
          AI 学习系统
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
            AI 学习系统
          </Link>
          <p className="mt-0.5 text-[10px] text-ink-mute">三导师 · 4 学习线 · 你的成长系统</p>
          {userEmail && (
            <p
              className="mt-2 truncate text-xs text-ink-mute"
              title={userEmail}
            >
              {userEmail}
            </p>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {NAV_GROUPS.map((group, gi) => (
            <NavGroupRender
              key={gi}
              group={group}
              current={current}
              groupIndex={gi}
            />
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
                <span className="text-sm font-medium">AI 学习系统</span>
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
            <nav className="flex-1 overflow-y-auto p-3">
              {NAV_GROUPS.map((group, gi) => (
                <NavGroupRender
                  key={gi}
                  group={group}
                  current={current}
                  groupIndex={gi}
                  onItemClick={() => setMobileMenuOpen(false)}
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

function NavGroupRender({
  group,
  current,
  groupIndex,
  onItemClick,
}: {
  group: NavGroup;
  current: NavKey;
  groupIndex: number;
  onItemClick?: () => void;
}) {
  return (
    <div className={groupIndex > 0 ? "mt-4" : ""}>
      {group.title && (
        <div className="mb-1 px-3 text-[10px] uppercase tracking-wider text-ink-mute">
          {group.title}
        </div>
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={current === item.key}
            onClick={onItemClick}
          />
        ))}
      </div>
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
  const isSoon = item.status === "soon";

  if (isSoon) {
    // 占位项:可点击但视觉上灰
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition opacity-60",
          active
            ? "bg-accent text-white opacity-100"
            : "text-ink-mute hover:bg-bg-warm/40"
        )}
        title="即将上线"
      >
        <span className="text-base">{item.icon}</span>
        <span>{item.label}</span>
        <span className="ml-auto text-[10px] text-ink-mute">soon</span>
      </Link>
    );
  }

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
