import { Calculator, Database } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Header() {
  return (
    <div className="mb-12">
      {/* Title Section */}
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Tarkov Boss Spawns
          </h1>
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
          <Accordion type="single" collapsible className="w-full max-w-xs mx-auto">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="text-xs text-gray-500 hover:text-gray-300 justify-center py-1 font-normal hover:no-underline data-[state=open]:text-gray-300"> 
                Recent Updates
              </AccordionTrigger>
              <AccordionContent className="text-center text-xs text-gray-400 pb-2"> 
                (28/03/2025): The Labyrinth bosses and chances have been added.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
