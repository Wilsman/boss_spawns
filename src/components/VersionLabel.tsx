import { Coffee } from "lucide-react";
import { LeagueRankCountdown } from "./LeagueRankCountdown";
import { VersionTag } from "./VersionTag";

export function VersionLabel() {
  return (
    <footer className="fixed bottom-0 left-0 z-50 w-full border-t border-white/[0.07] bg-black/80 py-2 backdrop-blur-md">
      <div className="w-full px-4">
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {/* Discord Button - Far Left */}
          <div className="order-1 flex items-center justify-start">
            <a
              href="https://discord.com/invite/3dFmr5qaJK"
              rel="nofollow"
              target="_blank"
              className="flex shrink-0 items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://img.shields.io/discord/1298971881776611470?color=7289DA&label=Discord&logo=discord&logoColor=white"
                alt="Discord"
                style={{ maxWidth: "100%" }}
                className="h-[18px] sm:h-5"
              />
            </a>
          </div>
          <div className="order-2 justify-self-end sm:justify-self-center"><LeagueRankCountdown /></div>
          {/* Changelog and support link - far right */}
          <div className="order-3 col-span-2 flex items-center justify-self-end gap-3 sm:col-span-1">
            <VersionTag />
            <span className="whitespace-nowrap text-[11px] text-gray-500 sm:text-xs">
              <a
                href="https://buymeacoffee.com/wilsman77"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                {/* The floating coffee widget is hidden on phones, so link it here */}
                <Coffee className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
                Wilsman77
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
