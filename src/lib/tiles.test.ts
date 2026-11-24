import { describe, expect, it } from "vitest";
import { makeFillPuzzle, sameWord } from "./logic";
import {
  EXTRA_TILES,
  TILE_TARGET,
  answerFromFill,
  answerFromType,
  answerLetters,
  buildLetterTiles,
  missingLetters,
} from "./tiles";

function counts(letters: readonly string[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const letter of letters) tally[letter] = (tally[letter] ?? 0) + 1;
  return tally;
}

function expectSuperset(tiles: readonly string[], required: readonly string[]) {
  const have = counts(tiles);
  const need = counts(required);
  for (const [letter, count] of Object.entries(need)) {
    expect(have[letter] ?? 0).toBeGreaterThanOrEqual(count);
  }
}

describe("ô chữ", () => {
  it("chỉ lấy chữ cái còn thiếu trong mặt nạ", () => {
    expect(missingLetters("c _ t", "cat")).toEqual(["a"]);
    expect(missingLetters("B y _ .", "Bye")).toEqual(["e"]);
    expect(missingLetters("I l_ke fish.", "like")).toEqual(["i"]);
    expect(missingLetters("c h _ _ r", "chair")).toEqual(["a", "i"]);
    expect(answerLetters("I like milk.")).toEqual(["i", "l", "i", "k", "e", "m", "i", "l", "k"]);
    expect(answerLetters("I like milk.").includes(" ")).toBe(false);
  });

  it("luôn có đủ chữ cần dùng, và đúng 10 ô khi câu trả lời không quá 10 chữ", () => {
    const samples = [
      ["a"],
      ["c", "a", "t"],
      ["b", "i", "l", "l"],
      answerLetters("I like milk."),
      answerLetters("dining room"),
      Array.from({ length: 10 }, () => "e"),
    ];
    for (const required of samples) {
      expect(required.length).toBeLessThanOrEqual(TILE_TARGET);
      for (const random of [() => 0, () => 0.37, () => 0.99]) {
        const tiles = buildLetterTiles(required, random);
        expect(tiles).toHaveLength(TILE_TARGET);
        expectSuperset(tiles, required.map((letter) => letter.toLowerCase()));
        expect(tiles.every((letter) => letter.length === 1 && letter >= "a" && letter <= "z")).toBe(true);
      }
    }
  });

  it("câu dài hơn 10 chữ thì hiện mọi chữ cần dùng và thêm vài chữ nhiễu", () => {
    const required = answerLetters("Good morning.");
    expect(required.length).toBeGreaterThan(TILE_TARGET);
    const tiles = buildLetterTiles(required, () => 0.2);
    expect(tiles).toHaveLength(required.length + EXTRA_TILES);
    expectSuperset(tiles, required);
  });

  it("ghép lại từ và câu, dấu cách không phải chữ để chạm", () => {
    expect(answerFromFill("c _ t", ["a"])).toBe("cat");
    expect(answerFromFill("B y _ .", ["e"])).toBe("Bye.");
    expect(answerFromFill("I l_ke fish.", ["i"])).toBe("like");
    expect(answerFromType("I like milk.", ["i", "l", "i", "k", "e", "m", "i", "l", "k"])).toBe("i like milk.");
    expect(answerFromType("dining room", answerLetters("dining room"))).toBe("dining room");
  });

  it("chữ bị ẩn của câu đố điền khớp với từ đáp án", () => {
    for (const phrase of ["cat", "Bye.", "chair", "I like milk.", "dining room", "Good morning.", "Hi, I am Bill."]) {
      for (let n = 0; n < 25; n++) {
        const puzzle = makeFillPuzzle(phrase);
        const missing = missingLetters(puzzle.mask, puzzle.answer);
        expect(missing.length).toBeGreaterThan(0);
        expect(sameWord(answerFromFill(puzzle.mask, missing), puzzle.answer)).toBe(true);
        const tiles = buildLetterTiles(missing, () => (n % 5) / 5);
        if (missing.length <= TILE_TARGET) expect(tiles).toHaveLength(TILE_TARGET);
        const have = counts(tiles);
        const need = counts(missing);
        for (const [letter, count] of Object.entries(need)) {
          expect(have[letter] ?? 0).toBeGreaterThanOrEqual(count);
        }
      }
    }
  });
});
