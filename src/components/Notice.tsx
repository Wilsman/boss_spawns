"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { manualNotice } from "@/config/manualNotice";
import { EventCountdown } from "@/components/EventCountdown";
import { ImageLightbox } from "@/components/ImageLightbox";

const changeDateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
});

const changeDayFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "UTC",
});

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatChangeDate(changedAt: string) {
  return DATE_ONLY_PATTERN.test(changedAt)
    ? changeDayFormatter.format(new Date(changedAt))
    : changeDateFormatter.format(new Date(changedAt));
}

export function Notice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  const isSingleEvent = manualNotice.events.length === 1;

  return (
    <section
      className={cn(
        "mt-3 w-full px-1 py-1",
        "opacity-0 transition-opacity duration-200 ease-out",
        isVisible && "opacity-100",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
          <h2 className="text-sm font-semibold text-zinc-300">
            {manualNotice.title}
          </h2>
          {manualNotice.events.length > 0 && manualNotice.badgeLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.045] px-2.5 py-1 text-xs font-medium text-gray-300">
              <Sparkles className="h-3.5 w-3.5" />
              {manualNotice.badgeLabel}
            </span>
          ) : null}
        </div>

        {manualNotice.events.length > 0 ? (
          <div
            className={cn(
              "grid gap-3",
              manualNotice.events.length > 1 && "lg:grid-cols-2",
            )}
          >
            {manualNotice.events.map((event) => {
            const changeDateLabel = event.changedAt
              ? formatChangeDate(event.changedAt)
              : null;
            const titleId = `notice-${event.id}-title`;

              return (
                <article
                  key={event.id}
                  aria-labelledby={titleId}
                  className={cn(
                    isSingleEvent
                      ? cn(
                          "flex flex-col",
                          (event.bossDisplayName || event.enlargeImage) &&
                            "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-x-6",
                        )
                      : "flex h-full flex-col rounded-md border border-white/[0.09] bg-[#0d0d0e] px-3 py-3",
                  )}
                >
                <div className="min-w-0">
                <div className="flex items-center gap-3">
                  {event.imageUrl ? (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/[0.1] bg-black">
                      <img
                        src={event.imageUrl}
                        alt={`${event.bossDisplayName ?? event.title} portrait`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="min-w-0 flex-1 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        id={titleId}
                        className="text-sm font-semibold text-zinc-100"
                      >
                        {event.title}
                      </h3>
                      <span className="inline-flex rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-200">
                        {event.badgeLabel}
                      </span>
                    </div>
                    {changeDateLabel && event.changedAt ? (
                      <time
                        dateTime={event.changedAt}
                        className="mt-1 block text-xs text-zinc-400 sm:mt-0"
                      >
                        Updated: {changeDateLabel}
                      </time>
                    ) : null}
                  </div>
                </div>

                {event.summary ? (
                  <p className="mt-2 text-sm text-gray-200">{event.summary}</p>
                ) : null}

                <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
                {event.highlights && event.highlights.length > 0 ? (
                  <details className="group col-span-2 col-start-1 row-start-1">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-sm py-2 text-xs font-medium text-blue-300 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 [&::-webkit-details-marker]:hidden">
                      <ChevronDown
                        className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                      <span className="group-open:hidden">Show details</span>
                      <span className="hidden group-open:inline">
                        Hide details
                      </span>
                    </summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                      {event.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}

                {event.linkUrl ? (
                  <a
                    href={event.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-start-2 row-start-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-sm py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    {event.linkLabel ?? "Read more"}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : null}
                </div>

                </div>

                {event.enlargeImage ? (
                  <ImageLightbox
                    className="md:mt-1"
                    alt={event.enlargeImage.alt}
                    src={event.enlargeImage.src}
                    thumbSrc={event.enlargeImage.thumbSrc}
                  />
                ) : null}

                {event.bossDisplayName ? (
                <dl
                  className={cn(
                    "mt-3 grid min-w-0 flex-1 grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm",
                    isSingleEvent &&
                      "md:mt-0 md:self-start md:border-l md:border-white/[0.08] md:pl-6",
                  )}
                >
                  <dt className="text-zinc-500">Boss</dt>
                  <dd className="min-w-0 text-zinc-100">
                    {event.bossDisplayName}
                  </dd>

                  <dt className="text-zinc-500">Status</dt>
                  <dd className="min-w-0 text-gray-200">
                    {event.statusLine}
                  </dd>

                  <dt className="text-zinc-500">Maps</dt>
                  <dd className="grid min-w-0 gap-x-6 gap-y-1 text-zinc-300 lg:grid-cols-2">
                    {event.mapRows?.map((row) => (
                      <div
                        key={`${row.bossName ?? event.bossDisplayName}-${row.mapName}`}
                      >
                        <span className="text-zinc-100">
                          {row.mapName} ({row.value})
                        </span>
                        {`: ${row.bossName ?? event.bossDisplayName} - ${row.locations}`}
                      </div>
                    ))}
                  </dd>

                  <dt className="text-zinc-500">Modes</dt>
                  <dd className="min-w-0 text-zinc-300">
                    {event.modes?.join(", ")}
                  </dd>
                </dl>
                ) : null}

                {event.endsAt ? (
                  <div className="mt-4 border-t border-white/[0.08] pt-3 md:col-span-2">
                    <EventCountdown
                      endsAt={event.endsAt}
                      mode={event.countdownMode}
                      note={event.endsNote}
                      originalEndsAt={event.originalEndsAt}
                      startsAt={event.startsAt}
                    />
                  </div>
                ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="border-t border-white/[0.08] pt-4 text-center text-sm text-zinc-500">
            No recent updates.
          </p>
        )}
      </div>
    </section>
  );
}

export default Notice;
