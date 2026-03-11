import { BellOff, BellPlus } from "lucide-react";

interface ChangeNotificationControlsProps {
  autoRefreshEnabled: boolean;
  canMarkAllRead?: boolean;
  errorText?: string | null;
  notificationsEnabled: boolean;
  notificationsSupported: boolean;
  onMarkAllRead?: () => void;
  onResetSettings?: () => void;
  onTestNotification?: () => void;
  onToggleAutoRefresh: () => void;
  onToggleNotifications: () => void | Promise<void>;
  onToggleSound: () => void;
  soundEnabled: boolean;
  unreadCount?: number;
}

export function ChangeNotificationControls({
  autoRefreshEnabled,
  canMarkAllRead = false,
  errorText,
  notificationsEnabled,
  notificationsSupported,
  onMarkAllRead,
  onResetSettings,
  onTestNotification,
  onToggleAutoRefresh,
  onToggleNotifications,
  onToggleSound,
  soundEnabled,
  unreadCount = 0,
}: ChangeNotificationControlsProps) {
  return (
    <div className="flex flex-col gap-2 p-2 border border-purple-500/30 rounded-lg bg-gray-800/30">
      <div className="flex items-center gap-2 md:flex-wrap">
        <span className="text-sm text-gray-400">
          {notificationsEnabled
            ? "Notifications enabled"
            : notificationsSupported
            ? "Get notified of changes"
            : "Notifications unavailable"}
        </span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-200">
            {unreadCount} unread
          </span>
        )}
        <button
          onClick={() => void onToggleNotifications()}
          className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
          title={
            notificationsEnabled
              ? "Disable notifications"
              : "Enable notifications"
          }
          disabled={!notificationsSupported && !notificationsEnabled}
        >
          {notificationsEnabled ? (
            <BellOff className="w-4 h-4 text-purple-400" />
          ) : (
            <BellPlus className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {notificationsEnabled && (
          <button
            onClick={onToggleSound}
            className={`p-1 rounded-full hover:bg-gray-700/50 transition-colors ${
              soundEnabled ? "text-purple-400" : "text-gray-400"
            }`}
            title={soundEnabled ? "Disable sound" : "Enable sound"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              {soundEnabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2 border-l border-gray-700 pl-2 ml-1">
          <span className="text-xs text-gray-400">Auto-refresh:</span>
          <button
            onClick={onToggleAutoRefresh}
            className={`px-2 py-1 text-xs rounded ${
              autoRefreshEnabled
                ? "bg-purple-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
            title={
              autoRefreshEnabled
                ? "Disable background checks (5 min)"
                : "Enable background checks (5 min)"
            }
          >
            {autoRefreshEnabled ? "ON (5m)" : "OFF"}
          </button>
        </div>
        {onTestNotification && (
          <button
            onClick={onTestNotification}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
            title="Test notification"
          >
            Test
          </button>
        )}
        {onMarkAllRead && (
          <button
            onClick={onMarkAllRead}
            disabled={!canMarkAllRead}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Mark all change notifications as read"
          >
            Mark All Read
          </button>
        )}
        {onResetSettings && (
          <button
            onClick={onResetSettings}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
            title="Reset local notification settings"
          >
            Reset
          </button>
        )}
      </div>
      {errorText && <p className="text-xs text-red-400">{errorText}</p>}
    </div>
  );
}
