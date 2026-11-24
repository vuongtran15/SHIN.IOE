import { useMemo, useRef, useState } from "react";
import {
  answerFromFill,
  answerFromType,
  answerLetters,
  buildLetterTiles,
  fillSlots,
  missingLetters,
  typeSlots,
  type Slot,
} from "./lib/tiles";

function renderSlots(slots: Slot[], filled: string[]) {
  let blank = 0;
  return slots.map((slot, index) => {
    if (slot.kind === "gap") return <span key={index} className="slot-gap" aria-hidden="true" />;
    if (slot.kind === "mark") {
      return (
        <span key={index} className="slot mark">
          {slot.char}
        </span>
      );
    }
    if (slot.kind === "letter") {
      return (
        <span key={index} className="slot given">
          {slot.char}
        </span>
      );
    }
    const letter = filled[blank++] ?? "";
    return (
      <span key={index} className={letter ? "slot picked" : "slot blank"}>
        {letter || " "}
      </span>
    );
  });
}

export function LetterTiles({
  kind,
  mask,
  answer,
  answered,
  onGrade,
}: {
  kind: "fill" | "type";
  mask: string;
  answer: string;
  answered: boolean;
  onGrade: (value: string) => void;
}) {
  const model = useMemo(() => {
    const needed = kind === "fill" ? missingLetters(mask, answer) : answerLetters(answer);
    return {
      needed,
      tiles: buildLetterTiles(needed),
      slots: kind === "fill" ? fillSlots(mask) : typeSlots(answer),
    };
  }, [kind, mask, answer]);
  const [used, setUsed] = useState<number[]>([]);
  const sent = useRef(false);
  const filled = used.map((index) => model.tiles[index] ?? "");
  const complete = model.needed.length === 0 || filled.length === model.needed.length;

  function submit(nextUsed: number[]) {
    if (sent.current || answered) return;
    sent.current = true;
    const letters = nextUsed.map((index) => model.tiles[index] ?? "");
    const value = kind === "fill" ? answerFromFill(mask, letters) : answerFromType(answer, letters);
    onGrade(value);
  }

  function tap(index: number) {
    if (answered || used.includes(index) || filled.length >= model.needed.length) return;
    const next = [...used, index];
    setUsed(next);
    if (next.length === model.needed.length) submit(next);
  }

  return (
    <div className="tiles-wrap">
      <div className="slots" aria-label={kind === "fill" ? "Chữ còn thiếu" : "Câu cần viết"}>
        {renderSlots(model.slots, filled)}
      </div>
      <p className="sub slots-help">
        {kind === "fill" ? "Chạm các chữ bị ẩn, theo thứ tự." : "Chạm các chữ theo thứ tự. Dấu cách tự thêm."}
      </p>
      <div className="tiles">
        {model.tiles.map((letter, index) => {
          const spent = used.includes(index);
          return (
            <button
              key={`${letter}-${index}`}
              type="button"
              className={spent ? "tile spent" : "tile"}
              disabled={answered || spent || filled.length >= model.needed.length}
              onClick={() => tap(index)}
            >
              {letter}
            </button>
          );
        })}
      </div>
      <div className="tile-actions">
        <button type="button" className="tile undo" disabled={answered || used.length === 0} onClick={() => setUsed(used.slice(0, -1))}>
          ← Lùi
        </button>
        <button type="button" className="tile clear" disabled={answered || used.length === 0} onClick={() => setUsed([])}>
          Xóa hết
        </button>
        <button type="button" className="btn orange" disabled={answered || !complete} onClick={() => submit(used)}>
          Kiểm tra
        </button>
      </div>
    </div>
  );
}
