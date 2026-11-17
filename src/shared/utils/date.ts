// src/shared/utils/date.ts
export function parseSafeDate(input: string | number | Date | null | undefined): Date | null {
  if (input === null || input === undefined || input === "") {
    return null;
  }

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Direct ISO attempt first
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d;
    }

    let normalized = trimmed.replace(" ", "T");
    normalized = normalized.replace(/([+-]\d{2})$/, "$1:00");

    d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return null;
}

export function formatConversationTime(input: string | number | Date | null | undefined): string {
  const date = parseSafeDate(input);
  if (!date) return "";

  const now = new Date();

  // Reset hours to compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDay.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  if (messageDay.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  const formatted = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return formatted || "";
}


export function formatMessageBubbleTime(input: string | number | Date | null | undefined): string {
  const date = parseSafeDate(input);
  if (!date) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}


export function formatReviewDate(input: string | number | Date | null | undefined): string {
  const date = parseSafeDate(input);
  if (!date) return "";

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

