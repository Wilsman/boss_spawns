import { motion } from "framer-motion";
import { useMemo } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
  badgeCount?: number;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const modeParam = useMemo(() => {
    const path = location.pathname.toLowerCase().replace(/^\/+/, "");
    if (path === "pvp") return "regular";
    if (path === "season") return "pvp-season";
    if (path === "pve" || path === "compare" || path === "changes") return path;
    return searchParams.get("mode")?.toLowerCase() || "regular";
  }, [location.pathname, searchParams]);

  return (
    <div className={cn("w-full overflow-x-auto pb-1", className)}>
      <div className="flex w-max min-w-max items-center gap-1 rounded-lg border border-white/[0.08] bg-[#080809] p-1">
        {items.map((item) => {
          const Icon = item.icon;
          // Special case for PVP tab which uses 'regular' in the URL
          const itemMode =
            item.url === "/pvp"
              ? "regular"
              : item.url === "/season"
              ? "pvp-season"
              : item.url.replace(/^\//, "");
          const isActive = itemMode === modeParam;

          // Preserve existing filters when switching modes
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("mode"); // Remove mode from query params
          const query = nextParams.toString();
          const to = `${item.url}${query ? `?${query}` : ""}`;

          return (
            <Link
              key={item.name}
              to={to}
              className={cn(
                "relative cursor-pointer rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-5",
                "text-gray-500 hover:bg-white/[0.035] hover:text-gray-200",
                isActive && "bg-[#1a1a1c] text-white"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon size={18} strokeWidth={2.5} />
                {item.name}
                {!!item.badgeCount && (
                  <span className="min-w-5 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-200">
                    {item.badgeCount > 99 ? "99+" : item.badgeCount}
                  </span>
                )}
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="pointer-events-none absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-blue-500"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
