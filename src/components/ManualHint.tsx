"use client";
import { useState, useEffect, useCallback } from "react";
import { Edit3, Save, X, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ManualHintData {
  bossName: string;
  hintText: string;
  sourceUrl?: string;
  sourceLabel?: string;
  lastUpdated: string;
}

const STORAGE_KEY = "manual_boss_hint";

const DEFAULT_HINT: Omit<ManualHintData, "lastUpdated"> = {
  bossName: "Goons",
  hintText: "could be 100% next",
  sourceUrl: "https://pbs.twimg.com/media/Guh0w2iXEAAtKk0?format=jpg&name=medium",
  sourceLabel: "Community Digest",
};

export function ManualHint() {
  const [isEditing, setIsEditing] = useState(false);
  const [hintData, setHintData] = useState<ManualHintData | null>(null);
  const [formData, setFormData] = useState({
    bossName: "",
    hintText: "",
    sourceUrl: "",
    sourceLabel: "",
  });

  const loadHint = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHintData(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse saved hint:", error);
      }
    }
  }, []);

  useEffect(() => {
    loadHint();
  }, [loadHint]);

  const handleEdit = () => {
    setFormData(hintData ? {
      bossName: hintData.bossName,
      hintText: hintData.hintText,
      sourceUrl: hintData.sourceUrl ?? "",
      sourceLabel: hintData.sourceLabel ?? "",
    } : {
      ...DEFAULT_HINT,
      sourceUrl: DEFAULT_HINT.sourceUrl ?? "",
      sourceLabel: DEFAULT_HINT.sourceLabel ?? "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const bossName = formData.bossName.trim();
    const hintText = formData.hintText.trim();

    if (!bossName || !hintText) return;

    const newHint: ManualHintData = {
      bossName,
      hintText,
      sourceUrl: formData.sourceUrl.trim() || undefined,
      sourceLabel: formData.sourceLabel.trim() || undefined,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHint));
    setHintData(newHint);
    setIsEditing(false);
  };

  const resetForm = () => {
    setFormData({
      bossName: "",
      hintText: "",
      sourceUrl: "",
      sourceLabel: "",
    });
    setIsEditing(false);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHintData(null);
    resetForm();
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className="border border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20 rounded-lg overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Manual Boss Hint
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-900/50"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                {hintData ? "Edit" : "Add Hint"}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={!formData.bossName.trim() || !formData.hintText.trim()}
                  className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/50"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-900/50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 pt-0">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bossName">Boss Name</Label>
                <Input
                  id="bossName"
                  value={formData.bossName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bossName: e.target.value }))}
                  placeholder="e.g., Goons, Killa, etc."
                  className="border-orange-300 focus:border-orange-500 dark:border-orange-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceLabel">Source Label (optional)</Label>
                <Input
                  id="sourceLabel"
                  value={formData.sourceLabel}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceLabel: e.target.value }))}
                  placeholder="e.g., Community Digest, BSG Tweet"
                  className="border-orange-300 focus:border-orange-500 dark:border-orange-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hintText">Hint Text</Label>
              <Textarea
                id="hintText"
                value={formData.hintText}
                onChange={(e) => setFormData(prev => ({ ...prev, hintText: e.target.value }))}
                placeholder="e.g., could be 100% next"
                className="border-orange-300 focus:border-orange-500 dark:border-orange-700 min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL (optional)</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder="https://..."
                className="border-orange-300 focus:border-orange-500 dark:border-orange-700"
              />
            </div>
            {hintData && (
              <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClear}
                  className="text-sm"
                >
                  Clear Hint
                </Button>
              </div>
            )}
          </div>
        ) : hintData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-orange-800 dark:text-orange-200 text-lg">
                {hintData.bossName}
              </span>
              <span className="text-orange-700 dark:text-orange-300">
                {hintData.hintText}
              </span>
            </div>
            {(hintData.sourceLabel || hintData.sourceUrl) && (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                <span>Source:</span>
                {hintData.sourceUrl ? (
                  <a
                    href={hintData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {hintData.sourceLabel || "Link"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span>{hintData.sourceLabel}</span>
                )}
              </div>
            )}
            <div className="text-xs text-orange-500 dark:text-orange-500">
              Last updated: {formatLastUpdated(hintData.lastUpdated)}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-orange-600 dark:text-orange-400">
            <p className="text-sm">No manual hint set.</p>
            <p className="text-xs mt-1">Click "Add Hint" to create a custom boss prediction.</p>
          </div>
        )}
      </div>
    </div>
  );
}