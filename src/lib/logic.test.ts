import { describe, expect, it } from "vitest";
import { DEFAULT_LIST, DEFAULT_PAIRS } from "../data/defaults";
import {
  allAnQuestions,
  answerLabel,
  articleFor,
  buildAnQuestions,
  buildQuestions,
  quizLengthNote,
  cleanToken,
  collectAnNouns,
  looksLikeSentence,
  makeFillPuzzle,
  makeQuestion,
  maskToken,
  parseLine,
  parseWordList,
  quizVocab,
  resultTitle,
  samePhrase,
  sameWord,
  splitTokens,
  starCount,
  type Question,
  type Word,
} from "./logic";

const PHRASES = [
  "dining room",
  "street market",
  "ice cream",
  "This is my bag.",
  "Bye, Bill.",
  "Hi, I am Bill.",
  "I like milk.",
  "I like fish.",
  "Good morning.",
  "I have a cat.",
];

function question(partial: Partial<Question> & Pick<Question, "kind" | "word" | "answer">): Question {
  return {
    prompt: "",
    options: [],
    mask: "",
    autoPlay: false,
    hint: "",
    speakText: partial.word.en,
    listenText: partial.word.en,
    ...partial,
  };
}

describe("parse danh sách từ", () => {
  it("đọc đúng 61 mục mẫu: 53 từ và 8 câu", () => {
    const words = parseWordList(DEFAULT_LIST);
    expect(words).toHaveLength(61);
    expect(DEFAULT_PAIRS).toHaveLength(61);
    expect(words.map((w) => [w.en, w.vi])).toEqual(DEFAULT_PAIRS.map((pair) => [pair[0], pair[1]]));
    expect(words.filter((w) => looksLikeSentence(w.en))).toHaveLength(8);
    expect(quizVocab(words)).toHaveLength(53);
    expect(words[0]).toEqual({ en: "chair", vi: "cái ghế" });
    expect(words[52]).toEqual({ en: "dog", vi: "con chó" });
    expect(words[53]).toEqual({ en: "This is my bag.", vi: "Đây là túi của tôi." });
    expect(words[60]).toEqual({ en: "Good morning.", vi: "Chào buổi sáng." });
    expect(looksLikeSentence("dining room")).toBe(false);
    expect(looksLikeSentence("street market")).toBe(false);
    expect(looksLikeSentence("Good morning.")).toBe(true);
    expect(looksLikeSentence("Hi there")).toBe(true);
    expect(looksLikeSentence("my bag")).toBe(false);
  });

  it("nhận dấu phân cách và cho phép bỏ nghĩa", () => {
    expect(parseLine("   ")).toBeNull();
    expect(parseLine(": nghĩa")).toBeNull();
    expect(parseLine(", nghĩa")).toBeNull();
    expect(parseLine(" - chỉ nghĩa")).toEqual({ en: "- chỉ nghĩa", vi: "" });
    expect(parseLine("apple")).toEqual({ en: "apple", vi: "" });
    expect(parseLine("apple - ")).toEqual({ en: "apple -", vi: "" });
    expect(parseLine("  chair - cái ghế  ")).toEqual({ en: "chair", vi: "cái ghế" });
    expect(parseLine("cat \u2013 con mèo")).toEqual({ en: "cat", vi: "con mèo" });
    expect(parseLine("cat \u2014 con mèo")).toEqual({ en: "cat", vi: "con mèo" });
    expect(parseLine("cat\tcon mèo")).toEqual({ en: "cat", vi: "con mèo" });
    expect(parseLine("cat: con mèo")).toEqual({ en: "cat", vi: "con mèo" });
    expect(parseLine("cat, con mèo")).toEqual({ en: "cat", vi: "con mèo" });
    expect(parseLine("cat - con mèo - nhà")).toEqual({ en: "cat", vi: "con mèo - nhà" });
    expect(parseLine("a \u2014 b - c")).toEqual({ en: "a", vi: "b - c" });
    expect(parseLine("cat: dog - chó")).toEqual({ en: "cat: dog", vi: "chó" });
    expect(parseLine("Bye, Bill.")).toEqual({ en: "Bye", vi: "Bill." });
    expect(parseLine("Bye, Bill. - Tạm biệt, Bill.")).toEqual({
      en: "Bye, Bill.",
      vi: "Tạm biệt, Bill.",
    });
    expect(parseLine("Hi, I am Bill. - Xin chào, tôi là Bill.")).toEqual({
      en: "Hi, I am Bill.",
      vi: "Xin chào, tôi là Bill.",
    });
  });

  it("bỏ dòng trống, chuẩn hóa xuống dòng và không lấy từ trùng", () => {
    expect(parseWordList("cat - a\r\ndog - chó\r\n\n")).toEqual([
      { en: "cat", vi: "a" },
      { en: "dog", vi: "chó" },
    ]);
    const deduped = parseWordList("cat - mèo\nCat - mèo nhà\ncat! - khác\n  \ndog - chó");
    expect(deduped).toEqual([
      { en: "cat", vi: "mèo" },
      { en: "dog", vi: "chó" },
    ]);
  });

  it("so khớp đáp án không phân biệt hoa thường, dấu câu và khoảng trắng", () => {
    expect(sameWord("Cat!", "cat")).toBe(true);
    expect(samePhrase("I like milk.", "i   like milk")).toBe(true);
    expect(samePhrase("Bye, Bill.", "bye bill")).toBe(true);
    expect(samePhrase("I like milk.", "I like fish.")).toBe(false);
    expect(sameWord("an", "AN")).toBe(true);
  });
});

describe("ẩn chữ khi điền", () => {
  it("khớp mặt nạ đã chốt cho từng từ đơn", () => {
    const expected: Record<string, string> = {
      cat: "c _ t",
      cake: "c _ k e",
      apple: "a _ p l _",
      dog: "d _ g",
      fish: "f _ s h",
      ball: "b _ l l",
      in: "_ n",
      cup: "c _ p",
      hat: "h _ t",
      a: "_",
      I: "_",
      "Bye.": "B y _ .",
      milk: "m _ l k",
      chair: "c h _ _ r",
      peach: "p _ _ c h",
      orange: "o r _ n g _",
      classroom: "c l _ s s r _ _ m",
      an: "_ n",
      my: "m _",
      is: "_ s",
      Good: "G _ o d",
      "bag.": "b _ g .",
    };
    for (const [word, mask] of Object.entries(expected)) {
      expect(maskToken(word, true)).toBe(mask);
      expect(maskToken(word, false)).toBe(mask.split(" ").join(""));
    }
    expect(makeFillPuzzle("cat")).toEqual({ mask: "c _ t", answer: "cat" });
    expect(makeFillPuzzle("Bye.")).toEqual({ mask: "B y _ .", answer: "Bye" });
  });

  it("từ có ít nhất 3 chữ cái giữ chữ cái đầu", () => {
    for (const word of ["cat", "cake", "apple", "classroom", "orange", "playground", "cupboard", "chair"]) {
      expect(maskToken(word, false).startsWith(word[0])).toBe(true);
      expect(maskToken(word, false).includes("_")).toBe(true);
    }
    expect(maskToken("in", false)).toBe("_n");
  });

  it("cụm từ và câu chỉ ẩn đúng một từ, bé gõ từ bị ẩn", () => {
    for (const phrase of PHRASES) {
      for (let n = 0; n < 30; n++) {
        const puzzle = makeFillPuzzle(phrase);
        const src = splitTokens(phrase);
        const masked = splitTokens(puzzle.mask);
        expect(src.length).toBeGreaterThan(1);
        expect(masked).toHaveLength(src.length);
        const changed = src.map((token, i) => token !== masked[i]);
        expect(changed.filter(Boolean)).toHaveLength(1);
        const idx = changed.indexOf(true);
        expect(masked[idx]).toBe(maskToken(src[idx], false));
        expect(masked[idx].includes("_")).toBe(true);
        expect(puzzle.answer).toBe(cleanToken(src[idx]));
        expect(puzzle.answer.includes(" ")).toBe(false);
        masked.forEach((token, i) => {
          if (i !== idx) expect(token.includes("_")).toBe(false);
        });
      }
    }
  });

  it("mọi câu trong danh sách mẫu cũng chỉ ẩn một từ", () => {
    const sentences = parseWordList(DEFAULT_LIST).filter((w) => splitTokens(w.en).length > 1);
    expect(sentences.length).toBeGreaterThanOrEqual(8);
    for (const word of sentences) {
      for (let n = 0; n < 15; n++) {
        const puzzle = makeFillPuzzle(word.en);
        const src = splitTokens(word.en);
        const masked = splitTokens(puzzle.mask);
        const changed = src.filter((token, i) => token !== masked[i]);
        expect(changed).toHaveLength(1);
        expect(puzzle.answer).toBe(cleanToken(changed[0]));
      }
    }
  });
});

describe("a / an", () => {
  it("chọn a hoặc an theo nguyên âm, phụ âm và danh sách ngoại lệ", () => {
    for (const noun of ["hour", "honest", "honour", "honor", "apple", "orange", "egg", "umbrella", "ice cream"]) {
      expect(articleFor(noun)).toBe("an");
    }
    for (const noun of ["university", "unicorn", "uniform", "euro", "european", "one", "useful", "unit", "cat", "bag", "pear", "dog"]) {
      expect(articleFor(noun)).toBe("a");
    }
    expect(articleFor("Hour")).toBe("an");
    expect(articleFor("hourglass")).toBe("a");
    expect(articleFor("One")).toBe("a");
  });

  it("gom danh từ đếm được số ít, bỏ câu, từ loại trừ và cụm của người dùng", () => {
    const words: Word[] = [
      { en: "hour", vi: "giờ" },
      { en: "university", vi: "đại học" },
      { en: "bananas", vi: "chuối" },
      { en: "dining room", vi: "phòng ăn" },
      { en: "one", vi: "số một" },
      { en: "apple", vi: "táo tàu" },
      { en: "ice cream", vi: "kem lạnh" },
      { en: "This is my bag.", vi: "Đây là túi của tôi." },
    ];
    const nouns = collectAnNouns(words);
    const ens = nouns.map((n) => n.en);
    expect(ens).toContain("hour");
    expect(ens).toContain("university");
    expect(ens).toContain("ice cream");
    expect(ens).not.toContain("bananas");
    expect(ens).not.toContain("dining room");
    expect(ens).not.toContain("one");
    expect(ens).not.toContain("This is my bag.");
    expect(nouns.find((n) => n.en === "apple")?.vi).toBe("táo tàu");
    expect(nouns.find((n) => n.en === "ice cream")?.vi).toBe("kem");
    expect(nouns.find((n) => n.en === "hour")?.vi).toBe("giờ");
    expect(nouns.find((n) => n.en === "egg")?.vi).toBe("quả trứng");
    expect(nouns.find((n) => n.en === "umbrella")?.vi).toBe("cái ô");
  });

  it("tạo câu hỏi a/an cố định và ba mẫu cho mỗi danh từ", () => {
    const empty = allAnQuestions([]);
    expect(empty[0]).toMatchObject({
      prompt: "This is ___ apple.",
      answer: "an",
      speakText: "This is an apple.",
      listenText: "apple",
      options: ["a", "an"],
      hint: "Dùng an trước từ bắt đầu bằng nguyên âm a, e, i, o, u",
    });
    expect(empty[1].prompt).toBe("I have ___ cat.");
    expect(empty[1].answer).toBe("a");
    expect(empty[2].prompt).toBe("I have ___ orange.");
    expect(empty[2].answer).toBe("an");
    expect(empty).toHaveLength(3 + 9 * 3);

    const words: Word[] = [
      { en: "hour", vi: "giờ" },
      { en: "university", vi: "đại học" },
      { en: "bananas", vi: "chuối" },
      { en: "dining room", vi: "phòng ăn" },
      { en: "one", vi: "số một" },
    ];
    const qs = allAnQuestions(words);
    expect(qs.filter((q) => q.listenText === "hour")).toHaveLength(3);
    expect(qs.filter((q) => q.listenText === "hour").every((q) => q.answer === "an")).toBe(true);
    expect(qs.filter((q) => q.listenText === "university").every((q) => q.answer === "a")).toBe(true);
    expect(qs.some((q) => q.listenText === "one")).toBe(false);
    expect(qs.some((q) => q.listenText === "bananas")).toBe(false);
    expect(qs.some((q) => q.listenText === "dining room")).toBe(false);
    const ice = qs.filter((q) => q.listenText === "ice cream");
    expect(ice.map((q) => q.prompt)).toEqual([
      "___ ice cream",
      "This is ___ ice cream.",
      "I have ___ ice cream.",
    ]);
    expect(ice.every((q) => q.answer === "an" && q.speakText.includes("an ice cream"))).toBe(true);

    const drill = buildAnQuestions(words, 20);
    expect(drill).toHaveLength(20);
    expect(drill.every((q) => q.kind === "a-an" && q.options.join(",") === "a,an")).toBe(true);
    expect(buildQuestions([], 6, "a-an").every((q) => q.kind === "a-an")).toBe(true);
    expect(buildQuestions([], 6, "all")).toEqual([]);
    expect(buildQuestions(parseWordList(DEFAULT_LIST), 0, "a-an")).toEqual([]);
    const mixed = buildQuestions(parseWordList(DEFAULT_LIST), 10, "all");
    expect(mixed).toHaveLength(10);
    const only = buildQuestions(parseWordList(DEFAULT_LIST), 10, "a-an");
    expect(only.every((q) => q.kind === "a-an")).toBe(true);
  });

  it("vẫn đủ 30 và 50 câu khi danh sách ngắn, và báo khi phải hỏi lại", () => {
    const few: Word[] = [{ en: "cat", vi: "con mèo" }];
    for (const count of [10, 20, 30, 50]) {
      const mixed = buildQuestions(few, count, "all");
      expect(mixed).toHaveLength(count);
      expect(mixed.every((q) => q.answer.trim().length > 0)).toBe(true);
      const drill = buildQuestions(few, count, "a-an");
      expect(drill).toHaveLength(count);
      expect(drill.every((q) => q.kind === "a-an" && q.options.join(",") === "a,an")).toBe(true);
    }
    expect(quizLengthNote(few, 50, "all")).toBe("Danh sách chưa đủ câu khác nhau, nên một số từ sẽ được hỏi lại.");
    expect(quizLengthNote(few, 10, "all")).toBe("Danh sách chưa đủ câu khác nhau, nên một số từ sẽ được hỏi lại.");
    expect(quizLengthNote(few, 50, "a-an")).toBe("Chưa đủ câu a / an khác nhau, nên một số câu sẽ được hỏi lại.");
    expect(quizLengthNote([], 30, "all")).toBe("Chưa tạo được câu hỏi. Hãy thêm từ vào danh sách nhé.");
    expect(buildQuestions([], 30, "all")).toEqual([]);
    expect(quizLengthNote([], 50, "a-an")).toBe("Chưa đủ câu a / an khác nhau, nên một số câu sẽ được hỏi lại.");
    expect(quizLengthNote(parseWordList(DEFAULT_LIST), 50, "all")).toBe("");
    expect(quizLengthNote(parseWordList(DEFAULT_LIST), 50, "a-an")).toBe("");
    expect(buildQuestions(parseWordList(DEFAULT_LIST), 30, "all")).toHaveLength(30);
    expect(buildQuestions(parseWordList(DEFAULT_LIST), 50, "a-an")).toHaveLength(50);
  });
});

describe("câu hỏi và điểm", () => {
  const vocab: Word[] = [
    { en: "cat", vi: "mèo" },
    { en: "dog", vi: "chó" },
    { en: "bird", vi: "chim" },
  ];

  it("nghĩa tiếng Việt chọn tiếng Anh, nghe chọn nghĩa", () => {
    const english = makeQuestion("en-choice", vocab[0], vocab);
    expect(english?.prompt).toBe("Nghĩa tiếng Việt: mèo");
    expect(english?.autoPlay).toBe(false);
    expect(english?.options).toHaveLength(3);
    expect(english?.options).toContain("cat");
    expect(new Set(english?.options)).toEqual(new Set(["cat", "dog", "bird"]));

    const meaning = makeQuestion("vi-choice", vocab[0], vocab);
    expect(meaning?.prompt).toBe("Nghe từ và chọn nghĩa đúng");
    expect(meaning?.autoPlay).toBe(true);
    expect(meaning?.answer).toBe("mèo");
    expect(new Set(meaning?.options)).toEqual(new Set(["mèo", "chó", "chim"]));

    const heard = makeQuestion("en-choice", { en: "cat", vi: "" }, [
      { en: "cat", vi: "" },
      { en: "dog", vi: "" },
      { en: "bird", vi: "" },
    ]);
    expect(heard?.prompt).toBe("Nghe và chọn từ tiếng Anh");
    expect(heard?.autoPlay).toBe(true);
    expect(makeQuestion("en-choice", vocab[0], vocab.slice(0, 2))).toBeNull();
    expect(makeQuestion("vi-choice", { en: "cat", vi: "" }, vocab)).toBeNull();
  });

  it("nhãn đáp án, sao và lời khen", () => {
    expect(
      answerLabel(
        question({
          kind: "fill",
          word: { en: "I like milk.", vi: "Tôi thích sữa." },
          answer: "milk",
        }),
      ),
    ).toBe("milk  ·  I like milk.");
    expect(
      answerLabel(question({ kind: "fill", word: { en: "cat", vi: "mèo" }, answer: "cat" })),
    ).toBe("cat");
    expect(
      answerLabel(
        question({
          kind: "a-an",
          word: { en: "This is an apple.", vi: "quả táo" },
          answer: "an",
          speakText: "This is an apple.",
        }),
      ),
    ).toBe("This is an apple.");
    expect(starCount(0, 0)).toBe(0);
    expect(starCount(0, 10)).toBe(1);
    expect(starCount(3, 10)).toBe(1);
    expect(starCount(4, 10)).toBe(2);
    expect(starCount(6, 10)).toBe(3);
    expect(starCount(8, 10)).toBe(4);
    expect(starCount(9, 10)).toBe(4);
    expect(starCount(10, 10)).toBe(5);
    expect(resultTitle(5)).toBe("Xuất sắc!");
    expect(resultTitle(4)).toBe("Giỏi quá!");
    expect(resultTitle(3)).toBe("Tốt lắm!");
    expect(resultTitle(2)).toBe("Cố lên nào!");
    expect(resultTitle(1)).toBe("Thử lại nhé!");
  });
});
