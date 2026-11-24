import { useEffect, useReducer } from "react";
import { DEFAULT_LIST } from "./data/defaults";
import {
  buildQuestions,
  parseWordList,
  pickOne,
  shuffled,
  YES_MSG,
  NO_MSG,
  samePhrase,
  sameWord,
  type Question,
  type Word,
} from "./lib/logic";
import { canSpeak, cancelSpeech, speakEnglish } from "./lib/speech";
import { loadList, saveList } from "./lib/storage";
import { FlashScreen, HomeScreen, ListScreen, QuizScreen, ResultScreen, SetupScreen } from "./screens";

type Screen = "home" | "list" | "flash" | "setup" | "quiz" | "result";
type QuizMode = "all" | "a-an";

type State = {
  screen: Screen;
  listText: string;
  storageOk: boolean;
  speechOk: boolean;
  savedNote: string;
  flashIndex: number;
  flipped: boolean;
  flashCards: Word[];
  qCount: 10 | 20;
  quizMode: QuizMode;
  questions: Question[];
  qIndex: number;
  score: number;
  answered: boolean;
  picked: string;
  typed: string;
  wasCorrect: boolean;
  feedback: string;
  quizSession: number;
};

type Action =
  | { type: "speech"; ok: boolean }
  | { type: "edit-list"; text: string }
  | { type: "saved"; text: string; note: string; storageOk: boolean }
  | { type: "goto"; screen: Screen }
  | { type: "open-flash"; cards: Word[]; storageOk: boolean }
  | { type: "flip" }
  | { type: "flash-prev" }
  | { type: "flash-next" }
  | { type: "flash-shuffle"; cards: Word[] }
  | { type: "set-count"; count: 10 | 20 }
  | { type: "set-mode"; mode: QuizMode }
  | { type: "open-setup"; storageOk: boolean }
  | { type: "start-quiz"; count: 10 | 20; mode: QuizMode; questions: Question[] }
  | { type: "grade"; answer: string; ok: boolean; feedback: string }
  | { type: "typed"; text: string }
  | { type: "next" }
  | { type: "result" };

function createInitialState(): State {
  const loaded = loadList(DEFAULT_LIST);
  return {
    screen: "home",
    listText: loaded.text,
    storageOk: loaded.storageOk,
    speechOk: canSpeak(),
    savedNote: "",
    flashIndex: 0,
    flipped: false,
    flashCards: [],
    qCount: 10,
    quizMode: "all",
    questions: [],
    qIndex: 0,
    score: 0,
    answered: false,
    picked: "",
    typed: "",
    wasCorrect: false,
    feedback: "",
    quizSession: 0,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "speech":
      return { ...state, speechOk: action.ok };
    case "edit-list":
      return { ...state, listText: action.text, savedNote: "" };
    case "saved":
      return { ...state, listText: action.text, savedNote: action.note, storageOk: action.storageOk };
    case "goto":
      return { ...state, screen: action.screen };
    case "open-flash":
      return {
        ...state,
        flashCards: action.cards,
        flashIndex: 0,
        flipped: false,
        screen: "flash",
        storageOk: action.storageOk,
        savedNote: "",
      };
    case "flip":
      return { ...state, flipped: !state.flipped };
    case "flash-prev": {
      const total = state.flashCards.length;
      if (total === 0) return state;
      return { ...state, flashIndex: (state.flashIndex - 1 + total) % total, flipped: false };
    }
    case "flash-next": {
      const total = state.flashCards.length;
      if (total === 0) return state;
      return { ...state, flashIndex: (state.flashIndex + 1) % total, flipped: false };
    }
    case "flash-shuffle":
      return { ...state, flashCards: action.cards, flashIndex: 0, flipped: false };
    case "set-count":
      return { ...state, qCount: action.count };
    case "set-mode":
      return { ...state, quizMode: action.mode };
    case "open-setup":
      return { ...state, screen: "setup", storageOk: action.storageOk, savedNote: "" };
    case "start-quiz":
      return {
        ...state,
        qCount: action.count,
        quizMode: action.mode,
        questions: action.questions,
        qIndex: 0,
        score: 0,
        answered: false,
        picked: "",
        typed: "",
        wasCorrect: false,
        feedback: "",
        screen: "quiz",
        quizSession: state.quizSession + 1,
      };
    case "grade":
      return {
        ...state,
        picked: action.answer,
        typed: action.answer,
        answered: true,
        wasCorrect: action.ok,
        feedback: action.feedback,
        score: state.score + (action.ok ? 1 : 0),
      };
    case "typed":
      return { ...state, typed: action.text };
    case "next":
      return {
        ...state,
        qIndex: state.qIndex + 1,
        answered: false,
        picked: "",
        typed: "",
        wasCorrect: false,
        feedback: "",
      };
    case "result":
      return { ...state, screen: "result" };
    default:
      return state;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const words = parseWordList(state.listText);

  useEffect(() => {
    if (!canSpeak()) return;
    const synth = window.speechSynthesis;
    const onVoices = () => dispatch({ type: "speech", ok: canSpeak() });
    synth.addEventListener("voiceschanged", onVoices);
    return () => synth.removeEventListener("voiceschanged", onVoices);
  }, []);

  useEffect(() => {
    if (state.screen !== "quiz" || state.answered) return;
    const q = state.questions[state.qIndex];
    if (q?.autoPlay) speakEnglish(q.listenText || q.word.en);
  }, [state.screen, state.quizSession, state.qIndex, state.answered, state.questions]);

  function persist(text: string, note: string) {
    const storageOk = saveList(text);
    dispatch({ type: "saved", text, note, storageOk });
  }

  function goHome() {
    cancelSpeech();
    dispatch({ type: "goto", screen: "home" });
  }

  function openFlash() {
    const list = parseWordList(state.listText);
    if (list.length === 0) return;
    const storageOk = saveList(state.listText);
    dispatch({ type: "open-flash", cards: list.slice(), storageOk });
  }

  function openSetup() {
    if (parseWordList(state.listText).length === 0) return;
    const storageOk = saveList(state.listText);
    dispatch({ type: "open-setup", storageOk });
  }

  function startQuiz(count: 10 | 20, mode: QuizMode) {
    const qs = buildQuestions(parseWordList(state.listText), count, mode);
    if (qs.length === 0) return;
    dispatch({ type: "start-quiz", count, mode, questions: qs });
  }

  function grade(answer: string) {
    const currentQ = state.questions[state.qIndex];
    if (state.answered || !currentQ) return;
    if (!String(answer).trim() && currentQ.options.length === 0) return;
    const ok = currentQ.kind === "type" ? samePhrase(answer, currentQ.answer) : sameWord(answer, currentQ.answer);
    const feedback = ok ? pickOne(YES_MSG, "Giỏi quá!") : pickOne(NO_MSG, "Thử lại nhé!");
    dispatch({ type: "grade", answer, ok, feedback });
    speakEnglish(currentQ.speakText || currentQ.word.en);
  }

  function nextQuestion() {
    if (!state.answered) return;
    if (state.qIndex + 1 >= state.questions.length) {
      dispatch({ type: "result" });
      return;
    }
    dispatch({ type: "next" });
  }

  return (
    <div className="shell">
      {state.screen === "home" ? (
        <HomeScreen count={words.length} speechOk={state.speechOk} onList={() => dispatch({ type: "goto", screen: "list" })} onFlash={openFlash} onQuiz={openSetup} />
      ) : null}
      {state.screen === "list" ? (
        <ListScreen
          listText={state.listText}
          words={words}
          savedNote={state.savedNote}
          storageOk={state.storageOk}
          onChange={(text) => dispatch({ type: "edit-list", text })}
          onSave={() => {
            const now = parseWordList(state.listText);
            persist(state.listText, now.length === 0 ? "Chưa có từ nào. Hãy dán danh sách nhé." : `Đã lưu ${now.length} từ và câu.`);
          }}
          onReset={() => persist(DEFAULT_LIST, "Đã khôi phục danh sách từ mẫu mới.")}
          onBack={goHome}
        />
      ) : null}
      {state.screen === "flash" ? (
        <FlashScreen
          cards={state.flashCards}
          index={state.flashIndex}
          flipped={state.flipped}
          speechOk={state.speechOk}
          onFlip={() => dispatch({ type: "flip" })}
          onPrev={() => dispatch({ type: "flash-prev" })}
          onNext={() => dispatch({ type: "flash-next" })}
          onShuffle={() => dispatch({ type: "flash-shuffle", cards: shuffled(state.flashCards) })}
          onSpeak={speakEnglish}
          onBack={goHome}
        />
      ) : null}
      {state.screen === "setup" ? (
        <SetupScreen
          count={state.qCount}
          total={words.length}
          mode={state.quizMode}
          speechOk={state.speechOk}
          onCount={(count) => dispatch({ type: "set-count", count })}
          onMode={(mode) => dispatch({ type: "set-mode", mode })}
          onStart={() => startQuiz(state.qCount, state.quizMode)}
          onBack={goHome}
        />
      ) : null}
      {state.screen === "quiz" ? (
        <QuizScreen
          questions={state.questions}
          qIndex={state.qIndex}
          score={state.score}
          answered={state.answered}
          picked={state.picked}
          typed={state.typed}
          wasCorrect={state.wasCorrect}
          feedback={state.feedback}
          speechOk={state.speechOk}
          questionKey={`${state.quizSession}-${state.qIndex}`}
          onGrade={grade}
          onTyped={(text) => dispatch({ type: "typed", text })}
          onNext={nextQuestion}
          onSpeak={speakEnglish}
          onBack={goHome}
        />
      ) : null}
      {state.screen === "result" ? (
        <ResultScreen
          score={state.score}
          total={state.questions.length}
          onAgain={() => startQuiz(state.qCount, state.quizMode)}
          onSetup={() => dispatch({ type: "goto", screen: "setup" })}
          onFlash={openFlash}
          onBack={goHome}
        />
      ) : null}
    </div>
  );
}
