export const STORAGE_KEY = "flashcard-lop1-words";

export function loadList(fallback: string): { text: string; storageOk: boolean } {
  try {
    if (typeof localStorage === "undefined") return { text: fallback, storageOk: false };
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return { text: saved, storageOk: true };
    return { text: fallback, storageOk: true };
  } catch {
    return { text: fallback, storageOk: false };
  }
}

export function saveList(text: string): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(STORAGE_KEY, text);
    return true;
  } catch {
    return false;
  }
}
