import { Calculator, Database, MessageCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BossNotice } from "./BossNotice";

const BOSS_IMAGES = [
  "/eft_boss_jaeger.webp",
  "/eft_boss_goons.webp",
  "/eft_boss_keban.webp",
  "/eft_boss_killer.webp",
  "/eft_boss_tagilla.webp",
  "/eft_boss_parasan.webp",
  "/eft_boss_reshala.webp",
  "/eft_boss_sanny.webp",
  "/eft_boss_shturman.webp",
];

function getRandomBossImage(): string {
  return BOSS_IMAGES[Math.floor(Math.random() * BOSS_IMAGES.length)];
}

interface HeaderProps {
  bossName: string;
  bossStartDate: Date;
  bossDurationSeconds: number;
}

export function Header({ bossName, bossStartDate, bossDurationSeconds }: HeaderProps) {
  return (
    <div className="">
      {/* Title Section */}
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-4">
          <a href="/">
            <img
              src={getRandomBossImage()}
              alt="EFT Boss Spawns Logo"
              width={300}
              height={100}
            />
          </a>
        </div>

        {/* Links Section */}
        <div className="flex flex-col space-y-3">
          {/* Discord Link */}
          <a
            href="https://discord.gg/wXTH6Z5n"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-gray-800/50 rounded-lg 
   hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02]
   border border-gray-700/50 hover:border-purple-500/50 shadow-lg shadow-black/20"
          >
            <svg
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 199"
              width="16"
              height="16"
              className="h-4 w-4 mr-1"
              fill="white"
              preserveAspectRatio="xMidYMid"
            >
              <path
                d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z"
                fill="#ffffff"
              />
            </svg>
            <span className="text-sm font-medium text-gray-300 transition-colors duration-300 sm:text-base group-hover:text-purple-400">
              Join our Discord Community
            </span>
            <svg
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 199"
              width="16"
              height="16"
              className="h-4 w-4 mr-1"
              fill="white"
              preserveAspectRatio="xMidYMid"
            >
              <path
                d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z"
                fill="#ffffff"
              />
            </svg>
          </a>
          
          {/* Existing Cultist Circle Link */}
          <a
            href="https://www.cultistcircle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-gray-800/50 rounded-lg
             hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02]
             border border-gray-700/50 hover:border-purple-500/50 shadow-lg shadow-black/20"
          >
            <Calculator className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:-rotate-12" />
            <span className="text-sm font-medium text-gray-300 transition-colors duration-300 sm:text-base group-hover:text-purple-400">
              Check out the Cultist Circle Calculator!
            </span>
            <Calculator className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
          </a>

          {/* New Tarkov.dev Attribution Link */}
          <a
            href="https://tarkov.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 bg-gray-800/50 rounded-lg 
             hover:bg-gray-700/50 transition-all duration-300 hover:scale-[1.02]
             border border-gray-700/50 hover:border-purple-500/50 shadow-lg shadow-black/20"
          >
            <Database className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-sm font-medium text-gray-300 transition-colors duration-300 sm:text-base group-hover:text-purple-400">
              Data provided by Tarkov.dev
            </span>
            <Database className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:-rotate-12" />
          </a>

          {/* Weekly Boss Notice (small, below attribution) */}
          <BossNotice
            boss={bossName}
            start={bossStartDate}
            durationSeconds={bossDurationSeconds}
          />

          {/* Collapsible Update Message */}
          <Accordion
            type="single"
            collapsible
            className="w-full max-w-xs mx-auto"
          >
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="text-xs text-gray-500 hover:text-gray-300 justify-center py-1 font-normal hover:no-underline data-[state=open]:text-gray-300">
                Recent Updates
              </AccordionTrigger>
              <AccordionContent className="text-center text-xs text-gray-400 pb-2">
                <span className="block mb-1">
                  (20/05/2025): refactor: reduced API calls by combining regular
                  and PVE data; changed refresh interval to every 5 minutes in
                  real-time
                </span>
                <span className="block mb-1">
                  (10/05/2025): Added weekly boss rotation notice.
                </span>
                <span className="block mb-1">
                  (13/04/2025): (hover card) Added total health.
                </span>
                <span className="block mb-1">
                  (12/04/2025): shadow-of-tagilla-disciple renamed to
                  labyrinthian.
                </span>
                <span className="block mb-1">
                  (01/04/2025): Reworked table layouts and added hover cards
                  when hovering boss names.
                </span>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
