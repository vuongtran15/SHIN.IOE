const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
export const TILE_TARGET = 10;
export const EXTRA_TILES = 3;

export type Slot =
  | { kind: "letter"; char: string }
  | { kind: "blank" }
  | { kind: "gap" }
  | { kind: "mark"; char: string };

function isAsciiLetter(ch: string): boolean {
  const c = ch.toLowerCase();
  return c.length === 1 && c >= "a" && c <= "z";
}

export function answerLetters(text: string): string[] {
  const letters: string[] = [];
  for (const ch of text) {
    if (isAsciiLetter(ch)) letters.push(ch.toLowerCase());
  }
  return letters;
}

function slotsFromPieces(pieces: string[]): Slot[] {
  const slots: Slot[] = [];
  for (const piece of pieces) {
    if (piece === "_") slots.push({ kind: "blank" });
    else if (isAsciiLetter(piece)) slots.push({ kind: "letter", char: piece });
    else if (piece.trim()) slots.push({ kind: "mark", char: piece });
  }
  return slots;
}

export function fillSlots(mask: string): Slot[] {
  const parts = mask.trim().split(/\s+/).filter(Boolean);
  const spaced = parts.length > 0 && parts.every((part) => part.length === 1);
  if (spaced) return slotsFromPieces(parts);
  const slots: Slot[] = [];
  parts.forEach((part, index) => {
    if (index > 0) slots.push({ kind: "gap" });
    slots.push(...slotsFromPieces(part.split("")));
  });
  return slots;
}

export function typeSlots(answer: string): Slot[] {
  const slots: Slot[] = [];
  let gap = false;
  for (const ch of answer) {
    if (ch === " " || ch === "\t" || ch === "\n") {
      gap = true;
      continue;
    }
    if (gap && slots.length > 0) slots.push({ kind: "gap" });
    gap = false;
    if (isAsciiLetter(ch)) slots.push({ kind: "blank" });
    else slots.push({ kind: "mark", char: ch });
  }
  return slots;
}

function hiddenSlots(mask: string): Slot[] {
  const parts = mask.trim().split(/\s+/).filter(Boolean);
  const spaced = parts.length > 0 && parts.every((part) => part.length === 1);
  if (spaced) return slotsFromPieces(parts);
  const hidden = parts.find((part) => part.includes("_")) ?? "";
  return slotsFromPieces(hidden.split(""));
}

export function missingLetters(mask: string, answer: string): string[] {
  const letters = answerLetters(answer);
  const missing: string[] = [];
  let index = 0;
  for (const slot of hiddenSlots(mask)) {
    if (slot.kind !== "letter" && slot.kind !== "blank") continue;
    if (slot.kind === "blank") {
      const letter = letters[index] ?? "";
      if (letter) missing.push(letter);
    }
    index += 1;
  }
  return missing;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    arr[i] = b as T;
    arr[j] = a as T;
  }
  return arr;
}

export function buildLetterTiles(required: readonly string[], random: () => number = Math.random): string[] {
  const needed = required.map((ch) => ch.toLowerCase()).filter((ch) => isAsciiLetter(ch));
  const tiles = needed.slice();
  const target = needed.length <= TILE_TARGET ? TILE_TARGET : needed.length + EXTRA_TILES;
  while (tiles.length < target) {
    const index = Math.min(ALPHABET.length - 1, Math.floor(random() * ALPHABET.length));
    tiles.push(ALPHABET[index] ?? "a");
  }
  return shuffle(tiles, random);
}

export function answerFromFill(mask: string, filled: readonly string[]): string {
  const parts = mask.trim().split(/\s+/).filter(Boolean);
  const spaced = parts.length > 0 && parts.every((part) => part.length === 1);
  let index = 0;
  const apply = (pieces: string[]) =>
    pieces
      .map((piece) => {
        if (piece === "_") return filled[index++] ?? "";
        return piece;
      })
      .join("");
  if (spaced) return apply(parts);
  const hidden = parts.find((part) => part.includes("_")) ?? "";
  return apply(hidden.split(""));
}

export function answerFromType(answer: string, filled: readonly string[]): string {
  let index = 0;
  return answer.replace(/[A-Za-z]/g, () => filled[index++] ?? "");
}
