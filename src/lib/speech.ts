const PREFERRED_VOICES = ["Samantha", "Google US", "Jenny", "Aria", "Zira", "Guy"];

export function canSpeak(): boolean {
  try {
    return typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis != null;
  } catch {
    return false;
  }
}

export function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!canSpeak()) return null;
  const voices = window.speechSynthesis.getVoices();
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    if (!voice || voice.lang.toLowerCase().indexOf("en-us") !== 0) continue;
    for (let n = 0; n < PREFERRED_VOICES.length; n++) {
      if (voice.name.indexOf(PREFERRED_VOICES[n]) !== -1) return voice;
    }
  }
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    if (voice && voice.lang.toLowerCase().indexOf("en-us") === 0) return voice;
  }
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    if (voice && voice.lang.toLowerCase().indexOf("en") === 0) return voice;
  }
  return null;
}

export function speakEnglish(text: string): boolean {
  if (!canSpeak() || !String(text).trim()) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    const voice = pickEnglishVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function cancelSpeech(): void {
  try {
    if (canSpeak()) window.speechSynthesis.cancel();
  } catch {
    /* Trình duyệt không cho hủy giọng đọc. */
  }
}

export function keepNodeVisible(node: HTMLElement | null): void {
  if (!node) return;
  try {
    node.scrollIntoView({ block: "center", behavior: "smooth" });
  } catch {
    node.scrollIntoView();
  }
}
