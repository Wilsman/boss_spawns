import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// Toggle this to enable/disable the patch toast
export const SHOW_PATCH_TOAST = true;

/**
 * PatchToast: Shows a patch notes toast on mount if enabled.
 * All logic and content is contained here. Just import and render <PatchToast /> once in your root layout or App.
 */
export function PatchToast() {
  useEffect(() => {
    if (!SHOW_PATCH_TOAST) return;
    const sessionKey = "patch-toast-shown-2025-07-23";
    if (sessionStorage.getItem(sessionKey)) return;
    toast({
      title: "✅ PvE Change",
      description:
        "📅 July 23, 2025\n\n" +
        "👹 Goons spawn rate on Lighthouse reduced to 39%\n" +
        "🔧 No other boss currently has a 100% spawn rate\n\n" +
        "— Battlestate Games",
      duration: 30000, // 30 seconds
      className: "border-green-600 bg-gray-800 shadow-lg z-50",
    });
    sessionStorage.setItem(sessionKey, "1");
  }, []);

  return null;
}
