import { useEffect, useRef } from "react";
import type { Question, Word } from "./lib/logic";
import { answerLabel, QUESTION_COUNTS, type QuestionCount, resultTitle, sameWord, splitTokens, starCount } from "./lib/logic";
import { keepNodeVisible } from "./lib/speech";

export function SpeechNote({ ok }: { ok: boolean }) {
  if (ok) return null;
  return (
    <p className="note">
      Máy này chưa đọc được tiếng. Nút loa vẫn hiện, nhưng hãy thử mở trang trên trình duyệt điện thoại hoặc máy tính nếu bé cần nghe phát âm.
    </p>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="back" onClick={onClick}>
      ← Về trang chủ
    </button>
  );
}

export function HomeScreen({
  count,
  speechOk,
  onList,
  onFlash,
  onQuiz,
}: {
  count: number;
  speechOk: boolean;
  onList: () => void;
  onFlash: () => void;
  onQuiz: () => void;
}) {
  return (
    <>
      <div className="card hero">
        <div className="big-emoji">⭐ 📘 🌟</div>
        <h1>Đồng hành học từ tiếng Anh lớp 1</h1>
        <p className="sub">
          Ba mẹ dán danh sách từ và câu. Bé học bằng thẻ flashcard, chọn A B C, điền chữ, luyện a / an và nghe đọc tiếng Anh.
        </p>
        <p style={{ fontSize: "clamp(18px, 2.4vw, 22px)", fontWeight: 700, margin: "18px 0 0" }}>
          Đang có {count} từ và câu trong danh sách
        </p>
      </div>
      <div style={{ height: 20 }} />
      <div className="stack">
        <button type="button" className="btn orange" onClick={onList}>
          📝 Danh sách từ của bé
        </button>
        <button type="button" className="btn" disabled={count === 0} onClick={onFlash}>
          🃏 Học thẻ flashcard
        </button>
        <button type="button" className="btn green" disabled={count === 0} onClick={onQuiz}>
          🎯 Trò chơi chọn A B C, điền chữ & a / an
        </button>
      </div>
      <SpeechNote ok={speechOk} />
      {count === 0 ? <p className="sub">Hãy thêm từ vào danh sách trước để bé bắt đầu học nhé.</p> : null}
    </>
  );
}

export function ListScreen({
  listText,
  words,
  savedNote,
  storageOk,
  onChange,
  onSave,
  onReset,
  onBack,
}: {
  listText: string;
  words: Word[];
  savedNote: string;
  storageOk: boolean;
  onChange: (text: string) => void;
  onSave: () => void;
  onReset: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <BackButton onClick={onBack} />
      <h1 style={{ marginTop: 8 }}>📝 Danh sách từ</h1>
      <p className="sub">
        Mỗi dòng một từ hoặc câu, theo mẫu <b>cat - con mèo</b>. Câu có dấu phẩy hãy viết: <b>Bye, Bill. - Tạm biệt, Bill.</b> Khi điền chữ, câu dài chỉ ẩn một từ.
      </p>
      <div style={{ height: 14 }} />
      <textarea
        value={listText}
        rows={14}
        spellCheck={false}
        aria-label="Danh sách từ cần học"
        onChange={(event) => onChange(event.target.value)}
      />
      <div style={{ height: 14 }} />
      <div className="row">
        <button type="button" className="btn green" onClick={onSave}>
          Lưu danh sách
        </button>
        <button type="button" className="btn purple" onClick={onReset}>
          Khôi phục từ mẫu
        </button>
      </div>
      {savedNote ? <p className="sub ok">{savedNote}</p> : null}
      {storageOk ? (
        <p className="sub">
          Danh sách được lưu trên máy này sau khi bấm Lưu. Nếu đang là danh sách cũ, bấm Khôi phục từ mẫu để lấy danh sách mới.
        </p>
      ) : (
        <p className="note">Trình duyệt này chưa lưu được danh sách sau khi đóng. Hãy giữ nguyên ô chữ.</p>
      )}
      <p style={{ fontSize: "clamp(18px, 2.3vw, 22px)", fontWeight: 700, margin: "10px 0" }}>
        {words.length} từ và câu đã đọc được
      </p>
      <div className="chips">
        {words.map((word, index) => (
          <span className="chip" key={`${word.en}-${index}`}>
            {word.en}
            {word.vi ? ` \u2014 ${word.vi}` : ""}
          </span>
        ))}
      </div>
    </>
  );
}

export function FlashScreen({
  cards,
  index,
  flipped,
  speechOk,
  onFlip,
  onPrev,
  onNext,
  onShuffle,
  onSpeak,
  onBack,
}: {
  cards: Word[];
  index: number;
  flipped: boolean;
  speechOk: boolean;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
}) {
  const card = cards[index];
  return (
    <>
      <BackButton onClick={onBack} />
      {!card ? (
        <p className="sub">Hãy thêm từ vào danh sách trước nhé.</p>
      ) : (
        <>
          <h1 style={{ marginTop: 8 }}>🃏 Thẻ flashcard</h1>
          <p className="sub">
            Thẻ {index + 1} / {cards.length} {"\u2014"} chạm vào thẻ để lật
          </p>
          <div style={{ height: 14 }} />
          <button type="button" className={flipped ? "flash back" : "flash front"} aria-label="Lật thẻ" onClick={onFlip}>
            <div className="side">{flipped ? "Nghĩa tiếng Việt" : "Tiếng Anh"}</div>
            <div className="word">{flipped ? card.vi || "(chưa có nghĩa)" : card.en}</div>
            <div className="side">{flipped ? "Chạm để xem tiếng Anh" : "Chạm để xem nghĩa"}</div>
          </button>
          <div style={{ height: 14 }} />
          <button type="button" className="btn wide" onClick={() => onSpeak(card.en)}>
            🔊 Nghe đọc “{card.en}”
          </button>
          <div style={{ height: 14 }} />
          <div className="row">
            <button type="button" className="btn purple" onClick={onPrev}>
              ← Trước
            </button>
            <button type="button" className="btn orange" onClick={onNext}>
              Sau →
            </button>
            <button type="button" className="btn pink" onClick={onShuffle}>
              🔀 Xáo trộn
            </button>
          </div>
          <SpeechNote ok={speechOk} />
        </>
      )}
    </>
  );
}

export function SetupScreen({
  count,
  total,
  mode,
  speechOk,
  repeatNote,
  onCount,
  onMode,
  onStart,
  onBack,
}: {
  count: number;
  total: number;
  mode: "all" | "a-an";
  speechOk: boolean;
  repeatNote: string;
  onCount: (count: QuestionCount) => void;
  onMode: (mode: "all" | "a-an") => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const note =
    mode === "a-an"
      ? "Bé sẽ chỉ chọn a hoặc an, ví dụ: This is ___ apple."
      : total < 3
        ? "Danh sách chưa đủ 3 từ nên bé sẽ chủ yếu điền chữ. Thêm từ để có câu chọn A B C nhé."
        : `Đang chơi với ${total} từ và câu, có xen câu a / an.`;
  return (
    <>
      <BackButton onClick={onBack} />
      <h1 style={{ marginTop: 8 }}>🎯 Sẵn sàng chơi</h1>
      <p className="sub">
        Câu hỏi được trộn ngẫu nhiên: chọn A B C, điền chữ, và phân biệt a / an. Bé có thể chỉ luyện a / an nếu muốn.
      </p>
      <div style={{ height: 20 }} />
      <p style={{ fontSize: "clamp(18px, 2.3vw, 22px)", fontWeight: 700, margin: "0 0 12px" }}>Chọn số câu</p>
      <div className="row counts">
        {QUESTION_COUNTS.map((n) => (
          <button key={n} type="button" className={count === n ? "btn header pick" : "btn"} onClick={() => onCount(n)}>
            {n} câu
          </button>
        ))}
      </div>
      {repeatNote ? <p className="note">{repeatNote}</p> : null}
      <div style={{ height: 20 }} />
      <p style={{ fontSize: "clamp(18px, 2.3vw, 22px)", fontWeight: 700, margin: "0 0 12px" }}>Dạng bài</p>
      <div className="row">
        <button type="button" className={mode === "all" ? "btn header pick" : "btn"} onClick={() => onMode("all")}>
          Tất cả câu hỏi
        </button>
        <button type="button" className={mode === "a-an" ? "btn header pick" : "btn purple"} onClick={() => onMode("a-an")}>
          Chỉ luyện a / an
        </button>
      </div>
      <div style={{ height: 20 }} />
      <button type="button" className="btn green wide" style={{ fontSize: "clamp(22px, 3vw, 28px)" }} onClick={onStart}>
        Bắt đầu 🎉
      </button>
      <p className="sub">{note}</p>
      <SpeechNote ok={speechOk} />
    </>
  );
}

export function QuizScreen({
  questions,
  qIndex,
  score,
  answered,
  picked,
  typed,
  wasCorrect,
  feedback,
  speechOk,
  questionKey,
  onGrade,
  onTyped,
  onNext,
  onSpeak,
  onBack,
}: {
  questions: Question[];
  qIndex: number;
  score: number;
  answered: boolean;
  picked: string;
  typed: string;
  wasCorrect: boolean;
  feedback: string;
  speechOk: boolean;
  questionKey: string;
  onGrade: (answer: string) => void;
  onTyped: (text: string) => void;
  onNext: () => void;
  onSpeak: (text: string) => void;
  onBack: () => void;
}) {
  const currentQ = questions[qIndex];
  const typingOpen = Boolean(currentQ && currentQ.options.length === 0 && !answered);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const onChange = () => {
      const field = document.querySelector('input[type="text"]');
      if (field instanceof HTMLElement && document.activeElement === field) keepNodeVisible(field);
    };
    viewport.addEventListener("resize", onChange);
    viewport.addEventListener("scroll", onChange);
    return () => {
      viewport.removeEventListener("resize", onChange);
      viewport.removeEventListener("scroll", onChange);
    };
  }, []);

  useEffect(() => {
    if (!typingOpen) return;
    const input = inputRef.current;
    const focusTimer = window.setTimeout(() => input?.focus(), 0);
    const scrollTimer = window.setTimeout(() => keepNodeVisible(input), 50);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [questionKey, typingOpen]);

  if (!currentQ) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <p className="sub">Hãy thêm từ vào danh sách trước nhé.</p>
      </div>
    );
  }

  const progress = ((qIndex + (answered ? 1 : 0)) / questions.length) * 100;
  const isPhraseMask = splitTokens(currentQ.word.en).length > 1;
  const typePlaceholder =
    currentQ.kind === "fill"
      ? "Gõ từ còn thiếu"
      : splitTokens(currentQ.word.en).length > 1
        ? "Gõ cả câu tiếng Anh"
        : "Gõ từ tiếng Anh";
  const listenNow = answered ? currentQ.speakText || currentQ.word.en : currentQ.listenText || currentQ.word.en;
  const letters = ["A", "B", "C"];
  const isLast = qIndex + 1 >= questions.length;

  return (
    <div className={typingOpen ? "quiz-type" : undefined}>
      <BackButton onClick={onBack} />
      <div className="scoreline">
        <p>
          Câu {qIndex + 1} / {questions.length}
        </p>
        <p>⭐ {score}</p>
      </div>
      <div className="bar" aria-hidden="true">
        <div style={{ width: `${progress}%` }} />
      </div>
      <div style={{ height: 18 }} />
      <div className="card">
        {currentQ.kind === "a-an" ? (
          <>
            <p style={{ margin: 0, fontSize: "clamp(18px, 2.3vw, 22px)", fontWeight: 700, color: "#5A6A85" }}>
              Chọn a hoặc an
            </p>
            <p
              style={{
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 700,
                textAlign: "center",
                margin: "16px 0 0",
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {currentQ.prompt}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, lineHeight: 1.35 }}>{currentQ.prompt}</p>
        )}
        {currentQ.kind === "fill" ? (
          <>
            <p className={isPhraseMask ? "mask phrase" : "mask"}>{currentQ.mask}</p>
            <p className="sub" style={{ textAlign: "center" }}>
              Gõ cả từ đang bị ẩn, không cần gõ những từ còn lại.
            </p>
          </>
        ) : null}
        {currentQ.kind === "vi-choice" ? <p className="sub">Bấm loa để nghe lại từ tiếng Anh.</p> : null}
      </div>
      <div style={{ height: 14 }} />
      <button type="button" className="btn wide" onClick={() => onSpeak(listenNow)}>
        {currentQ.kind === "a-an" && !answered ? "🔊 Nghe từ" : "🔊 Nghe phát âm"}
      </button>
      <div style={{ height: 14 }} />
      {currentQ.options.length > 0 ? (
        <div className="stack">
          {currentQ.options.map((opt, i) => {
            let cls = "option";
            if (answered && sameWord(opt, currentQ.answer)) cls += " correct";
            else if (answered && sameWord(opt, picked)) cls += " wrong";
            return (
              <button key={`${letters[i]}-${opt}`} type="button" className={cls} disabled={answered} onClick={() => onGrade(opt)}>
                <span className="letter">{letters[i]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            key={`${questionKey}-${answered ? "done" : "open"}`}
            type="text"
            value={typed}
            placeholder={typePlaceholder}
            aria-label={typePlaceholder}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            disabled={answered}
            onChange={(event) => onTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onGrade(event.currentTarget.value);
              }
            }}
            onFocus={(event) => keepNodeVisible(event.currentTarget)}
          />
          {!answered ? (
            <button
              type="button"
              className="btn orange wide"
              style={{ marginTop: 12 }}
              onClick={() => onGrade(inputRef.current?.value ?? typed)}
            >
              Kiểm tra
            </button>
          ) : null}
        </div>
      )}
      {answered ? (
        <div className={wasCorrect ? "card feedback yes" : "card feedback no"}>
          <p style={{ fontSize: "clamp(26px, 3.4vw, 34px)", fontWeight: 700, margin: 0 }}>
            {wasCorrect ? "✨ " : "💖 "}
            {feedback}
          </p>
          <p style={{ fontSize: "clamp(18px, 2.4vw, 24px)", fontWeight: wasCorrect ? 500 : 700, margin: "12px 0 0" }}>
            {wasCorrect ? "" : "Đáp án: "}
            {answerLabel(currentQ)}
            {currentQ.word.vi ? ` \u2014 ${currentQ.word.vi}` : ""}
          </p>
          {currentQ.hint ? (
            <p className="sub" style={{ color: "#1A2B4A", fontWeight: 700, textAlign: "center" }}>
              {currentQ.hint}
            </p>
          ) : null}
          <button type="button" className="btn header wide" style={{ marginTop: 16 }} onClick={onNext}>
            {isLast ? "Xem kết quả" : "Câu tiếp theo"}
          </button>
        </div>
      ) : null}
      <SpeechNote ok={speechOk} />
    </div>
  );
}

export function ResultScreen({
  score,
  total,
  onAgain,
  onSetup,
  onFlash,
  onBack,
}: {
  score: number;
  total: number;
  onAgain: () => void;
  onSetup: () => void;
  onFlash: () => void;
  onBack: () => void;
}) {
  const stars = starCount(score, total);
  const starText = `${"⭐".repeat(stars)}${"☆".repeat(Math.max(0, 5 - stars))}`;
  const title = resultTitle(stars);
  return (
    <>
      <BackButton onClick={onBack} />
      <div className="card hero" style={{ marginTop: 8 }}>
        <p className="stars">{starText}</p>
        <h1 style={{ marginTop: 12 }}>{title}</h1>
        <p style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, margin: "14px 0 0" }}>
          Bé làm đúng {score}/{total} câu
        </p>
        <p className="sub">{stars >= 4 ? "Ba mẹ khen bé một trận nào!" : "Làm lại lần nữa là tiến bộ ngay đó."}</p>
      </div>
      <div style={{ height: 20 }} />
      <div className="stack">
        <button type="button" className="btn green" onClick={onAgain}>
          🔄 Làm lại
        </button>
        <button type="button" className="btn" onClick={onSetup}>
          Đổi số câu
        </button>
        <button type="button" className="btn orange" onClick={onFlash}>
          Ôn học thẻ
        </button>
      </div>
    </>
  );
}
