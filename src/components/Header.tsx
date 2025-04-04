import { Calculator, Database } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Header() {
  return (
    <div className="">
      {/* Title Section */}
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-4">
          <a href="/">
            <img
              src="/eft_boss.webp"
              alt="EFT Boss Spawns Logo"
              width={300}
              height={100}
            />
          </a>
        </div>

        {/* Links Section */}
        <div className="flex flex-col space-y-3">
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
                  (02/04/2025): Added Bender font.
                </span>
                <span className="block mb-1">
                  (01/04/2025): Reworked table layouts and added hover cards
                  when hovering boss names.
                </span>
                <span className="block">
                  (28/03/2025): The Labyrinth bosses and chances have been
                  added.
                </span>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
