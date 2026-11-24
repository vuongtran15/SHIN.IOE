/** Bản chuyển nguyên logic từ file HTML gốc: đọc danh sách, ẩn chữ, a/an và tạo câu hỏi. */

export type Word = { en: string; vi: string };

export type QuestionKind = "en-choice" | "vi-choice" | "fill" | "type" | "a-an";

export type Question = {
  kind: QuestionKind;
  word: Word;
  prompt: string;
  answer: string;
  options: string[];
  mask: string;
  autoPlay: boolean;
  hint: string;
  speakText: string;
  listenText: string;
};

export type FillPuzzle = { mask: string; answer: string };

const NL = "\n";
const CR = "\r";
const TAB = "\t";

export const A_AN_HINT = "Dùng an trước từ bắt đầu bằng nguyên âm a, e, i, o, u";

export const YES_MSG = ["Giỏi quá!", "Đúng rồi!", "Xuất sắc!", "Bạn giỏi lắm!", "Tuyệt vời!"];
export const NO_MSG = ["Thử lại nhé!", "Chưa đúng, không sao đâu!", "Gần rồi, xem đáp án nhé!"];

const A_AN_EXCEPTIONS: Record<string, "a" | "an"> = {
  hour: "an",
  honest: "an",
  honour: "an",
  honor: "an",
  university: "a",
  unicorn: "a",
  uniform: "a",
  euro: "a",
  european: "a",
  one: "a",
  useful: "a",
  unit: "a",
};

const NOT_A_AN_LIST = [
  "bananas",
  "grapes",
  "milk",
  "and",
  "like",
  "have",
  "can",
  "say",
  "in",
  "one",
  "two",
  "three",
  "five",
  "green",
  "red",
  "hi",
  "bye",
  "bill",
  "this",
  "is",
  "my",
  "am",
  "i",
  "good",
  "morning",
  "a",
  "an",
  "the",
  "or",
  "to",
  "of",
  "for",
  "with",
  "on",
  "at",
  "it",
];

const DEFAULT_A_AN: Word[] = [
  { en: "apple", vi: "quả táo" },
  { en: "orange", vi: "quả cam" },
  { en: "egg", vi: "quả trứng" },
  { en: "umbrella", vi: "cái ô" },
  { en: "ice cream", vi: "kem" },
  { en: "cat", vi: "con mèo" },
  { en: "bag", vi: "cái túi" },
  { en: "pear", vi: "quả lê" },
  { en: "duck", vi: "con vịt" },
];

const FIXED_A_AN: Array<{ prompt: string; full: string; answer: "a" | "an"; noun: string; vi: string }> = [
  { prompt: "This is ___ apple.", full: "This is an apple.", answer: "an", noun: "apple", vi: "quả táo" },
  { prompt: "I have ___ cat.", full: "I have a cat.", answer: "a", noun: "cat", vi: "con mèo" },
  { prompt: "I have ___ orange.", full: "I have an orange.", answer: "an", noun: "orange", vi: "quả cam" },
];

const PUNCT = ".,!?;:\"'()[]…“”‘’";
const DASH_SEPARATORS = [" - ", " \u2013 ", " \u2014 "];

export function shuffled<T>(items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i];
    const b = arr[j];
    arr[i] = b;
    arr[j] = a;
  }
  return arr;
}

export function pickOne<T>(items: readonly T[], fallback: T): T {
  if (items.length === 0) return fallback;
  return items[Math.floor(Math.random() * items.length)] as T;
}

function isLetter(ch: string): boolean {
  const c = ch.toLowerCase();
  return c >= "a" && c <= "z";
}

function isVowel(ch: string): boolean {
  const c = ch.toLowerCase();
  return c === "a" || c === "e" || c === "i" || c === "o" || c === "u";
}

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === TAB || ch === NL || ch === CR;
}

function isPunct(ch: string): boolean {
  return PUNCT.indexOf(ch) !== -1;
}

export function normalizeText(text: string): string {
  return text.split(CR + NL).join(NL).split(CR).join(NL);
}

export function normalizeSpace(text: string): string {
  const chars = text.trim().split("");
  let out = "";
  let gap = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] || "";
    if (isWhitespace(ch)) gap = true;
    else {
      if (gap && out) out += " ";
      gap = false;
      out += ch;
    }
  }
  return out;
}

export function stripPunct(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] || "";
    if (!isPunct(ch)) out += ch;
  }
  return out;
}

export function normalizeForCheck(text: string): string {
  return normalizeSpace(stripPunct(text)).toLowerCase();
}

export function sameWord(a: string, b: string): boolean {
  return normalizeForCheck(a) === normalizeForCheck(b);
}

export function samePhrase(a: string, b: string): boolean {
  return normalizeForCheck(a) === normalizeForCheck(b);
}

export function splitTokens(text: string): string[] {
  const s = normalizeSpace(text);
  if (!s) return [];
  const parts: string[] = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i] || "";
    if (ch === " ") {
      if (cur) parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur) parts.push(cur);
  return parts;
}

export function letterCount(token: string): number {
  let n = 0;
  for (let i = 0; i < token.length; i++) {
    if (isLetter(token[i] || "")) n += 1;
  }
  return n;
}

export function cleanToken(token: string): string {
  return stripPunct(token).trim();
}

export function maskToken(word: string, spaced: boolean): string {
  const chars = word.split("");
  const letterIdx: number[] = [];
  for (let i = 0; i < chars.length; i++) {
    if (isLetter(chars[i] || "")) letterIdx.push(i);
  }
  if (letterIdx.length === 0) return spaced ? chars.join(" ") : word;
  const hide: Record<number, boolean> = {};
  if (letterIdx.length === 1) hide[letterIdx[0]] = true;
  else {
    const first = letterIdx[0];
    const vowels: number[] = [];
    const rest: number[] = [];
    for (let i = 0; i < letterIdx.length; i++) {
      const idx = letterIdx[i];
      const ch = chars[idx] || "";
      if (isVowel(ch)) vowels.push(idx);
      else if (idx !== first) rest.push(idx);
    }
    const order = vowels.concat(rest);
    const nHide = Math.max(1, Math.round(letterIdx.length / 3));
    for (let k = 0; k < order.length && Object.keys(hide).length < nHide; k++) {
      const idx = order[k];
      if (letterIdx.length >= 3 && idx === first) continue;
      hide[idx] = true;
    }
    if (Object.keys(hide).length === 0) hide[letterIdx[letterIdx.length - 1]] = true;
  }
  const mapped = chars.map((c, i) => (hide[i] ? "_" : c));
  return spaced ? mapped.join(" ") : mapped.join("");
}

export function makeFillPuzzle(phrase: string): FillPuzzle {
  const tokens = splitTokens(phrase);
  if (tokens.length === 0) return { mask: phrase, answer: phrase };
  if (tokens.length === 1) {
    const only = tokens[0];
    return { mask: maskToken(only, true), answer: cleanToken(only) };
  }
  const long: number[] = [];
  const any: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const n = letterCount(tokens[i]);
    if (n >= 2) long.push(i);
    if (n >= 1) any.push(i);
  }
  const pool = long.length > 0 ? long : any;
  const idx = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 0;
  const hidden = tokens[idx];
  const masked = tokens.slice();
  masked[idx] = maskToken(hidden, false);
  return { mask: masked.join(" "), answer: cleanToken(hidden) };
}

export function parseLine(line: string): Word | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let at = -1;
  let len = 0;
  for (let s = 0; s < DASH_SEPARATORS.length; s++) {
    const i = trimmed.indexOf(DASH_SEPARATORS[s]);
    if (i !== -1 && (at < 0 || i < at)) {
      at = i;
      len = DASH_SEPARATORS[s].length;
    }
  }
  if (at < 0) {
    const tab = trimmed.indexOf(TAB);
    if (tab !== -1) {
      at = tab;
      len = 1;
    }
  }
  if (at < 0) {
    const c = trimmed.indexOf(":");
    if (c !== -1) {
      at = c;
      len = 1;
    }
  }
  if (at < 0) {
    const c = trimmed.indexOf(",");
    if (c !== -1) {
      at = c;
      len = 1;
    }
  }
  let en = trimmed;
  let vi = "";
  if (at >= 0) {
    en = trimmed.slice(0, at).trim();
    vi = trimmed.slice(at + len).trim();
  }
  if (!en) return null;
  return { en, vi };
}

export function parseWordList(text: string): Word[] {
  const words: Word[] = [];
  const seen: Record<string, boolean> = {};
  const lines = normalizeText(text).split(NL);
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i] || "");
    if (!parsed) continue;
    const key = normalizeForCheck(parsed.en);
    if (!key || seen[key]) continue;
    seen[key] = true;
    words.push(parsed);
  }
  return words;
}

export function looksLikeSentence(en: string): boolean {
  const s = en.trim();
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "." || ch === "!" || ch === "?") return true;
  }
  const tokens = splitTokens(stripPunct(s));
  if (tokens.length >= 3) return true;
  if (tokens.length >= 2) {
    const first = tokens[0].toLowerCase();
    if (first === "hi" || first === "bye" || first === "i" || first === "this" || first === "good") return true;
  }
  return false;
}

export function quizVocab(words: readonly Word[]): Word[] {
  return words.filter((w) => !looksLikeSentence(w.en));
}

export function articleFor(noun: string): "a" | "an" {
  const tokens = splitTokens(stripPunct(noun));
  const first = (tokens[0] || noun).toLowerCase();
  const exception = A_AN_EXCEPTIONS[first];
  if (exception) return exception;
  return isVowel(first.charAt(0)) ? "an" : "a";
}

export function collectAnNouns(words: readonly Word[]): Word[] {
  const out: Word[] = [];
  const seen: Record<string, boolean> = {};
  function add(en: string, vi: string, allowMulti: boolean) {
    const key = normalizeForCheck(en);
    if (!key || seen[key] || NOT_A_AN_LIST.indexOf(key) !== -1 || looksLikeSentence(en)) return;
    if (!allowMulti && splitTokens(stripPunct(en)).length > 1) return;
    seen[key] = true;
    out.push({ en, vi });
  }
  for (let i = 0; i < words.length; i++) add(words[i].en, words[i].vi, false);
  for (let i = 0; i < DEFAULT_A_AN.length; i++) add(DEFAULT_A_AN[i].en, DEFAULT_A_AN[i].vi, true);
  return out;
}

function makeAnQuestion(prompt: string, full: string, answer: string, noun: string, vi: string): Question {
  return {
    kind: "a-an",
    word: { en: full, vi },
    prompt,
    answer,
    options: ["a", "an"],
    mask: "",
    autoPlay: true,
    hint: A_AN_HINT,
    speakText: full,
    listenText: noun,
  };
}

export function allAnQuestions(words: readonly Word[]): Question[] {
  const nouns = collectAnNouns(words);
  const pool: Question[] = [];
  for (let i = 0; i < FIXED_A_AN.length; i++) {
    const f = FIXED_A_AN[i];
    pool.push(makeAnQuestion(f.prompt, f.full, f.answer, f.noun, f.vi));
  }
  for (let i = 0; i < nouns.length; i++) {
    const n = nouns[i];
    const art = articleFor(n.en);
    pool.push(makeAnQuestion("___ " + n.en, art + " " + n.en, art, n.en, n.vi));
    pool.push(makeAnQuestion("This is ___ " + n.en + ".", "This is " + art + " " + n.en + ".", art, n.en, n.vi));
    pool.push(makeAnQuestion("I have ___ " + n.en + ".", "I have " + art + " " + n.en + ".", art, n.en, n.vi));
  }
  return pool;
}

export function buildAnQuestions(words: readonly Word[], count: number): Question[] {
  const pool = shuffled(allAnQuestions(words));
  if (pool.length === 0 || count <= 0) return [];
  const questions: Question[] = [];
  let i = 0;
  while (questions.length < count) {
    questions.push(pool[i % pool.length]);
    i += 1;
    if (i % pool.length === 0) {
      const again = shuffled(pool);
      for (let k = 0; k < pool.length; k++) pool[k] = again[k];
    }
  }
  return questions;
}

function uniqueField(words: readonly Word[], field: "en" | "vi", except: string): string[] {
  const out: string[] = [];
  const seen: Record<string, boolean> = {};
  seen[normalizeForCheck(except)] = true;
  for (let i = 0; i < words.length; i++) {
    const value = field === "en" ? words[i].en : words[i].vi;
    const key = normalizeForCheck(value);
    if (!value.trim() || seen[key]) continue;
    seen[key] = true;
    out.push(value);
  }
  return out;
}

function withSpeak(q: Omit<Question, "hint" | "speakText" | "listenText"> & Partial<Pick<Question, "hint" | "speakText" | "listenText">>): Question {
  return {
    ...q,
    hint: q.hint || "",
    speakText: q.speakText || q.word.en,
    listenText: q.listenText || q.word.en,
    options: q.options,
    mask: q.mask,
  };
}

export function makeQuestion(kind: QuestionKind, word: Word, words: readonly Word[]): Question | null {
  if (kind === "en-choice") {
    const extras = shuffled(uniqueField(words, "en", word.en)).slice(0, 2);
    if (extras.length < 2) return null;
    return withSpeak({
      kind,
      word,
      prompt: word.vi ? "Nghĩa tiếng Việt: " + word.vi : "Nghe và chọn từ tiếng Anh",
      answer: word.en,
      options: shuffled([word.en, extras[0], extras[1]]),
      mask: "",
      autoPlay: !word.vi,
    });
  }
  if (kind === "vi-choice") {
    if (!word.vi) return null;
    const extras = shuffled(uniqueField(words, "vi", word.vi)).slice(0, 2);
    if (extras.length < 2) return null;
    return withSpeak({
      kind,
      word,
      prompt: "Nghe từ và chọn nghĩa đúng",
      answer: word.vi,
      options: shuffled([word.vi, extras[0], extras[1]]),
      mask: "",
      autoPlay: true,
    });
  }
  if (kind === "fill") {
    const puzzle = makeFillPuzzle(word.en);
    return withSpeak({
      kind,
      word,
      prompt: word.vi ? "Điền từ còn thiếu: " + word.vi : "Gõ từ còn thiếu trong chỗ trống",
      answer: puzzle.answer,
      options: [],
      mask: puzzle.mask,
      autoPlay: true,
    });
  }
  const isPhrase = splitTokens(word.en).length > 1;
  return withSpeak({
    kind: "type",
    word,
    prompt: word.vi
      ? isPhrase
        ? "Gõ câu tiếng Anh: " + word.vi
        : "Gõ từ tiếng Anh: " + word.vi
      : isPhrase
        ? "Gõ cả câu tiếng Anh bạn vừa nghe"
        : "Gõ từ tiếng Anh bạn vừa nghe",
    answer: word.en,
    options: [],
    mask: "",
    autoPlay: true,
  });
}

export function buildQuestions(words: readonly Word[], count: number, mode: string): Question[] {
  if (count <= 0) return [];
  if (mode === "a-an") return buildAnQuestions(words, count);
  if (words.length === 0) return [];
  const vocab = quizVocab(words);
  const kinds: QuestionKind[] = ["fill", "type"];
  if (uniqueField(vocab, "en", "___none___").length >= 3) kinds.push("en-choice");
  if (uniqueField(vocab, "vi", "___none___").length >= 3) kinds.push("vi-choice");
  if (allAnQuestions(words).length > 0) kinds.push("a-an");
  const bag = shuffled(words);
  const questions: Question[] = [];
  let n = 0;
  let guard = 0;
  while (questions.length < count && guard < count * 8) {
    guard += 1;
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    if (kind === "a-an") {
      const aq = buildAnQuestions(words, 1)[0];
      if (aq) questions.push(aq);
      continue;
    }
    const pool = (kind === "en-choice" || kind === "vi-choice") && vocab.length > 0 ? vocab : words;
    const word = shuffled(pool)[0] || bag[n % bag.length];
    n += 1;
    if (!word) continue;
    let q = makeQuestion(kind, word, pool);
    if (!q) q = makeQuestion("type", word, words);
    if (q) questions.push(q);
  }
  return questions;
}

export function starCount(score: number, total: number): number {
  if (total <= 0) return 0;
  const p = score / total;
  if (p >= 1) return 5;
  if (p >= 0.8) return 4;
  if (p >= 0.6) return 3;
  if (p >= 0.4) return 2;
  return 1;
}

export function resultTitle(stars: number): string {
  if (stars >= 5) return "Xuất sắc!";
  if (stars >= 4) return "Giỏi quá!";
  if (stars >= 3) return "Tốt lắm!";
  if (stars >= 2) return "Cố lên nào!";
  return "Thử lại nhé!";
}

export function answerLabel(q: Question): string {
  if (q.kind === "a-an") return q.speakText || q.word.en;
  if (q.kind === "fill" && !samePhrase(q.answer, q.word.en)) {
    return q.answer + "  ·  " + q.word.en;
  }
  return q.word.en;
}
