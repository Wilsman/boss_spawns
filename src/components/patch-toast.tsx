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
    const sessionKey = "patch-toast-shown-2025-05-14";
    if (sessionStorage.getItem(sessionKey)) return;
    toast({
      title: "✅ Completed",
      description:
        "📅 May 14, 2025\n\n" +
        "🔧 Removed silent walking for BirdEye, Shturman, Partizan, and Cultists. They should now walk about 20–35% quieter than the rest.\n\n" +
        "— YOWA, Lead of Game Design, Battlestate Games",
      duration: 30000, // 30 seconds
      className: "border-green-600 bg-gray-800 shadow-lg z-50",
    });
    sessionStorage.setItem(sessionKey, "1");
  }, []);

  return null;
}
