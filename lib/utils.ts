import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { router } from "expo-router";

/**
 * Combines class names using clsx and tailwind-merge.
 * This ensures Tailwind classes are properly merged without conflicts.
 *
 * Usage:
 * ```tsx
 * cn("px-4 py-2", isActive && "bg-primary", className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely navigates back if there's a screen in the history stack.
 * Falls back to replacing to a default route (or the provided fallback) if not.
 * Prevents the "GO_BACK was not handled by any navigator" error.
 *
 * Usage:
 * ```tsx
 * safeGoBack()              // falls back to '/'
 * safeGoBack('/(tabs)')     // falls back to tabs
 * ```
 */
export function safeGoBack(fallbackRoute?: string) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace((fallbackRoute || '/') as any);
  }
}
