import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT = "ca-pub-4028411901202065";
const RAIL_SLOTS = { left: "4899010325", right: "2165035774" } as const;

// The page content is capped at 1536px (Tailwind `container` at 2xl). A 160px
// rail plus 16px gaps on each side only fits from 1888px wide, and 720px tall
// keeps the 600px ad clear of the fixed footer.
const SHOW_RAIL =
  "hidden [@media(min-width:1888px)_and_(min-height:720px)]:block";

type AdRailProps = { side: keyof typeof RAIL_SLOTS };

/** A fixed 160x600 ad in the empty page margin. It never overlaps content. */
export function AdRail({ side }: AdRailProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const ad = adRef.current;
    // Hidden rails have no width; requesting them would only log AdSense errors.
    if (!ad || ad.offsetWidth === 0 || ad.dataset.adsbygoogleStatus) return;
    try {
      // AdSense loads after the page; it processes queued pushes once ready.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      className={`${SHOW_RAIL} fixed top-24 z-0 w-[160px]`}
      style={side === "left" ? { left: "calc(50% - 944px)" } : { right: "calc(50% - 944px)" }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "inline-block", width: 160, height: 600 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={RAIL_SLOTS[side]}
      />
    </aside>
  );
}
