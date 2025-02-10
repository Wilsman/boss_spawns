export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  // For timestamps older than 30 days, return the date
  if (days > 30) {
    return new Date(timestamp).toLocaleDateString();
  }

  // For timestamps older than 24 hours, show days
  if (days >= 1) {
    return `${days}d ago`;
  }

  // For timestamps older than an hour, show hours
  if (hours >= 1) {
    return `${hours}h ago`;
  }

  // For timestamps older than a minute, show minutes
  if (minutes >= 1) {
    return `${minutes}m ago`;
  }

  // For timestamps less than a minute, show seconds
  return seconds <= 0 ? 'just now' : `${seconds}s ago`;
}