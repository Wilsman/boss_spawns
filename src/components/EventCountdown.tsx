import { useEffect, useState, type CSSProperties } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const localFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const shortDayFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

const utcFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const THEMES = {
  live: {
    dot: "bg-amber-400",
    fill: "from-amber-600/70 via-amber-400 to-amber-200",
    glow: "bg-amber-200 shadow-[0_0_10px_2px_rgba(251,191,36,0.55)]",
    text: "text-amber-100",
  },
  urgent: {
    dot: "bg-red-400",
    fill: "from-red-700/70 via-red-500 to-red-300",
    glow: "bg-red-200 shadow-[0_0_10px_2px_rgba(248,113,113,0.6)]",
    text: "text-red-100",
  },
  ended: {
    dot: "bg-zinc-500",
    fill: "from-zinc-700 to-zinc-500",
    glow: "",
    text: "text-zinc-400",
  },
} as const;

const EXTENSION_STRIPES: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 6px)",
};

function userTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function parseTime(value?: string) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function splitRemaining(ms: number) {
  const clamped = Math.max(0, ms);
  return {
    days: Math.floor(clamped / DAY),
    hours: Math.floor((clamped % DAY) / HOUR),
    minutes: Math.floor((clamped % HOUR) / MINUTE),
    seconds: Math.floor((clamped % MINUTE) / SECOND),
  };
}

function formatSpan(ms: number) {
  const days = Math.round(ms / DAY);
  if (days >= 1) return `${days}d`;
  return `${Math.max(1, Math.round(ms / HOUR))}h`;
}

function useNow(stopAt: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (now >= stopAt) return;
    // Align ticks to the wall-clock second so the digits change in step.
    const timeout = window.setTimeout(
      () => setNow(Date.now()),
      SECOND - (Date.now() % SECOND),
    );
    return () => window.clearTimeout(timeout);
  }, [now, stopAt]);

  return now;
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return mounted;
}

function Segment({
  pad = true,
  unit,
  value,
}: {
  pad?: boolean;
  unit: string;
  value: number;
}) {
  const text = pad ? String(value).padStart(2, "0") : String(value);
  return (
    <span className="inline-flex items-baseline">
      <span className="relative inline-block overflow-hidden tabular-nums">
        <span
          key={text}
          className="inline-block motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300"
        >
          {text}
        </span>
      </span>
      <span className="ml-px text-[0.75em] font-normal opacity-50">{unit}</span>
    </span>
  );
}

interface EventCountdownProps {
  className?: string;
  endsAt: string;
  label?: string;
  note?: string;
  /** Original end before an extension; marked on the bar. */
  originalEndsAt?: string;
  startsAt?: string;
}

export function EventCountdown({
  className,
  endsAt,
  label = "Ends in",
  note,
  originalEndsAt,
  startsAt,
}: EventCountdownProps) {
  const end = parseTime(endsAt) ?? NaN;
  const now = useNow(end);
  const mounted = useMounted();
  const [open, setOpen] = useState(false);

  if (!Number.isFinite(end)) return null;

  const start = parseTime(startsAt);
  const originalEnd = parseTime(originalEndsAt);
  const hasBar = start !== null && start < end;
  const total = hasBar ? end - start : 0;
  const toPercent = (time: number) =>
    hasBar ? Math.min(100, Math.max(0, ((time - start) / total) * 100)) : 0;

  const remaining = end - now;
  const ended = remaining <= 0;
  const urgent = !ended && remaining < DAY;
  const theme = THEMES[ended ? "ended" : urgent ? "urgent" : "live"];
  const progress = toPercent(now);
  const shownProgress = mounted ? progress : 0;
  const extensionAt =
    hasBar && originalEnd !== null && originalEnd > start && originalEnd < end
      ? toPercent(originalEnd)
      : null;

  const { days, hours, minutes, seconds } = splitRemaining(remaining);
  const localLabel = localFormatter.format(end);
  const utcLabel = `${utcFormatter.format(end)} GMT`;
  const timeZone = userTimeZone();

  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            // Tooltips don't open on tap, so let touch users toggle it.
            onClick={() => setOpen((value) => !value)}
            aria-live="off"
            className={cn(
              "group block w-full rounded-md text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#09090a]",
              className,
            )}
          >
            <span className="flex items-end justify-between gap-3">
              <span className={cn("flex items-center gap-2.5", theme.text)}>
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  {!ended ? (
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping",
                        theme.dot,
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative inline-flex h-2 w-2 rounded-full",
                      theme.dot,
                    )}
                  />
                </span>
                {ended ? (
                  <span className="text-sm font-medium">Event ended</span>
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {label}
                    </span>
                    <time
                      dateTime={new Date(end).toISOString()}
                      className="inline-flex items-baseline gap-1.5 text-base font-semibold leading-none"
                      aria-hidden="true"
                    >
                      {days > 0 ? (
                        <Segment value={days} unit="d" pad={false} />
                      ) : null}
                      <Segment value={hours} unit="h" />
                      <Segment value={minutes} unit="m" />
                      <Segment value={seconds} unit="s" />
                    </time>
                  </>
                )}
              </span>

              {hasBar ? (
                <span className="text-xs tabular-nums text-zinc-500 transition-colors group-hover:text-zinc-300">
                  {ended ? "100" : progress.toFixed(1)}%
                </span>
              ) : null}

              <span className="sr-only">
                {ended ? "Ended" : "Ends"} {localLabel}
              </span>
            </span>

            {hasBar ? (
              <span className="mt-3 block" aria-hidden="true">
                <span className="relative block h-1 rounded-full bg-white/[0.06] transition-[height] duration-300 group-hover:h-1.5">
                  {extensionAt !== null ? (
                    <span
                      className="absolute inset-y-0 right-0 rounded-r-full"
                      style={{ left: `${extensionAt}%`, ...EXTENSION_STRIPES }}
                    />
                  ) : null}

                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r",
                      "transition-[width] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                      theme.fill,
                    )}
                    style={{ width: `${shownProgress}%` }}
                  >
                    {!ended ? (
                      <span className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/50 to-transparent motion-safe:animate-bar-shimmer" />
                    ) : null}
                  </span>

                  {extensionAt !== null ? (
                    <span
                      className="absolute -top-1 bottom-[-4px] w-px bg-white/30"
                      style={{ left: `${extensionAt}%` }}
                    />
                  ) : null}

                  {!ended ? (
                    <span
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ left: `${shownProgress}%` }}
                    >
                      <span
                        className={cn(
                          "block h-2.5 w-2.5 rounded-full transition-transform duration-300 group-hover:scale-125",
                          theme.glow,
                        )}
                      />
                    </span>
                  ) : null}
                </span>

                <span className="relative mt-2 flex justify-between text-[11px] text-zinc-500">
                  <span>{shortDayFormatter.format(start)}</span>
                  {extensionAt !== null && originalEnd !== null ? (
                    <span
                      className="absolute top-0 hidden pl-1.5 text-zinc-500 sm:inline"
                      style={{ left: `${extensionAt}%` }}
                    >
                      Extended +{formatSpan(end - originalEnd)}
                    </span>
                  ) : null}
                  <span>{shortDayFormatter.format(end)}</span>
                </span>
              </span>
            ) : null}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="start"
            sideOffset={8}
            className={cn(
              "z-50 min-w-[220px] rounded-md border border-white/[0.1] bg-[#111113] px-3 py-2.5 text-xs shadow-xl shadow-black/50",
              "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:zoom-in-95",
              "data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out",
            )}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {ended ? "Ended" : "Ends"} · your time
            </div>
            <div className="mt-0.5 text-sm font-semibold text-zinc-100">
              {localLabel}
            </div>
            {timeZone ? (
              <div className="text-[11px] text-zinc-500">{timeZone}</div>
            ) : null}
            <div className="mt-2 border-t border-white/[0.08] pt-2 text-zinc-400">
              {utcLabel}
            </div>
            {note ? <div className="mt-1 text-zinc-500">{note}</div> : null}
            <Tooltip.Arrow className="fill-[#111113]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export default EventCountdown;
