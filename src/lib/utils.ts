import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexByte(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, "0");
}

export function hexOffset(n: number): string {
  return "0x" + n.toString(16).toUpperCase().padStart(4, "0");
}

export function downloadBytes(filename: string, bytes: Uint8Array) {
  const copy = Uint8Array.from(bytes);
  const blob = new Blob([copy.buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
