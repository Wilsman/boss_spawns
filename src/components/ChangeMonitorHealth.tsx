import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, XCircle } from "lucide-react";
import {
  fetchChangeMonitorHealth,
  getChangeGameModeLabel,
  type ChangeMonitorHealth as ChangeMonitorHealthData,
} from "@/lib/api";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { cn } from "@/lib/utils";

type MonitorStatus = "checking" | "healthy" | "delayed" | "unavailable";

const HEALTH_REFRESH_INTERVAL_MS = 60 * 1000;

const statusPresentation: Record<
  MonitorStatus,
  { label: string; dotClass: string; buttonClass: string }
> = {
  checking: {
    label: "Checking monitor",
    dotClass: "bg-gray-500 animate-pulse",
    buttonClass: "border-white/[0.09] bg-[#0b0b0c] text-gray-400",
  },
  healthy: {
    label: "Monitor healthy",
    dotClass: "bg-emerald-400",
    buttonClass:
      "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-200 hover:border-emerald-400/40",
  },
  delayed: {
    label: "Monitor delayed",
    dotClass: "bg-amber-400",
    buttonClass:
      "border-amber-500/30 bg-amber-500/[0.08] text-amber-200 hover:border-amber-400/45",
  },
  unavailable: {
    label: "Monitor unavailable",
    dotClass: "bg-rose-400",
    buttonClass:
      "border-rose-500/30 bg-rose-500/[0.08] text-rose-200 hover:border-rose-400/45",
  },
};

function formatPollTime(timestamp: number | null): string {
  if (!timestamp) return "No successful poll recorded";

  return `Last successful poll ${new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function ChangeMonitorHealth() {
  const [health, setHealth] = useState<ChangeMonitorHealthData | null>(null);
  const [status, setStatus] = useState<MonitorStatus>("checking");
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const checkedRelativeTime = useRelativeTime(checkedAt);
  const presentation = statusPresentation[status];

  useEffect(() => {
    let disposed = false;
    let activeController: AbortController | null = null;

    const checkHealth = async () => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        const nextHealth = await fetchChangeMonitorHealth(controller.signal);
        if (disposed) return;

        setHealth(nextHealth);
        setStatus(
          nextHealth.healthy && !nextHealth.modes.some((mode) => mode.stale)
            ? "healthy"
            : "delayed"
        );
      } catch (error) {
        if (disposed || controller.signal.aborted) return;

        console.warn("Change monitor health check failed.", error);
        setHealth(null);
        setStatus("unavailable");
      } finally {
        if (!disposed && !controller.signal.aborted) {
          setCheckedAt(Date.now());
        }
      }
    };

    void checkHealth();
    const intervalId = window.setInterval(checkHealth, HEALTH_REFRESH_INTERVAL_MS);

    return () => {
      disposed = true;
      activeController?.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${presentation.label}; checked ${checkedRelativeTime}`}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 sm:px-2.5",
          presentation.buttonClass
        )}
      >
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 shrink-0 rounded-full", presentation.dotClass)}
        />
        <span className="hidden sm:inline">{presentation.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "hidden h-3.5 w-3.5 transition-transform sm:block",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[min(88vw,340px)] overflow-hidden rounded-lg border border-white/[0.12] bg-[#101011] shadow-2xl">
          <div className="border-b border-white/[0.08] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-100">Change monitor</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Checked {checkedRelativeTime}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold",
                  status === "healthy" && "bg-emerald-500/10 text-emerald-300",
                  status === "delayed" && "bg-amber-500/10 text-amber-300",
                  status === "unavailable" && "bg-rose-500/10 text-rose-300",
                  status === "checking" && "bg-white/[0.06] text-gray-400"
                )}
              >
                {status === "healthy" && <Check className="h-3 w-3" />}
                {status === "delayed" && <AlertTriangle className="h-3 w-3" />}
                {status === "unavailable" && <XCircle className="h-3 w-3" />}
                {status === "checking" ? "Checking" : presentation.label.replace("Monitor ", "")}
              </span>
            </div>
          </div>

          <div className="space-y-1 p-2">
            {health?.modes.map((mode) => {
              const label = getChangeGameModeLabel(mode.gameMode) ?? mode.gameMode;
              return (
                <div
                  key={mode.gameMode}
                  className="rounded-md border border-white/[0.06] bg-black/15 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            mode.stale ? "bg-amber-400" : "bg-emerald-400"
                          )}
                        />
                        <span className="text-xs font-semibold text-gray-200">{label}</span>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-gray-500">
                        {formatPollTime(mode.lastSuccessAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        mode.stale ? "text-amber-300" : "text-emerald-300"
                      )}
                    >
                      {mode.stale ? "Delayed" : "Healthy"}
                    </span>
                  </div>
                  {mode.lastError && (
                    <p className="mt-2 border-t border-rose-500/10 pt-2 text-[11px] text-rose-300/90">
                      {mode.lastError}
                    </p>
                  )}
                </div>
              );
            })}

            {!health && status !== "checking" && (
              <div className="rounded-md border border-rose-500/15 bg-rose-500/[0.05] px-3 py-3 text-xs text-rose-200">
                The monitor health endpoint could not be reached. Existing change history may still be available.
              </div>
            )}

            {!health && status === "checking" && (
              <div className="px-3 py-4 text-center text-xs text-gray-500">
                Checking the monitor now…
              </div>
            )}
          </div>

          <p className="border-t border-white/[0.08] px-4 py-3 text-[11px] leading-relaxed text-gray-500">
            Health confirms the Worker is polling successfully. It does not validate Tarkov&apos;s source data.
          </p>
        </div>
      )}
    </div>
  );
}
