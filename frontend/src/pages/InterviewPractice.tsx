import { useEffect, useRef, useState } from "react";
import { Navbar } from "../components/Navbar";
import { api, ApiError } from "../lib/api";
import type { InterviewAttempt, InterviewCategory, InterviewQuestion } from "../lib/types";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { inputClass } from "../components/ui/Field";

const CATEGORIES: { value: InterviewCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "SITUATIONAL", label: "Situational" },
];

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function InterviewPractice() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [category, setCategory] = useState<InterviewCategory | "ALL">("ALL");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [selected, setSelected] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceSupported = getSpeechRecognition() !== null;

  useEffect(() => {
    api
      .get<{ configured: boolean }>("/interview/status")
      .then((res) => setConfigured(res.configured))
      .catch(() => setConfigured(false));
    api
      .get<{ attempts: InterviewAttempt[] }>("/interview/attempts")
      .then((res) => setAttempts(res.attempts))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const query = category === "ALL" ? "" : `?category=${category}`;
    api
      .get<{ questions: InterviewQuestion[] }>(`/interview/questions${query}`)
      .then((res) => setQuestions(res.questions));
  }, [category]);

  function selectQuestion(q: InterviewQuestion) {
    setSelected(q);
    setAnswer("");
    setFeedback(null);
    setError(null);
  }

  function toggleRecording() {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    if (recording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) {
          finalText += result[0]?.transcript ?? "";
        }
      }
      if (finalText) {
        setAnswer((prev) => (prev ? `${prev} ${finalText}` : finalText).trim());
      }
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  async function handleSubmit() {
    if (!selected || !answer.trim()) return;
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await api.post<{ feedback: string | null }>("/interview/practice", {
        questionId: selected.id,
        answer: answer.trim(),
      });
      setFeedback(res.feedback);
      const attemptsRes = await api.get<{ attempts: InterviewAttempt[] }>("/interview/attempts");
      setAttempts(attemptsRes.attempts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Interview practice</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Pick a question, answer by typing or speaking, and get feedback.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                category === c.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {questions.map((q) => (
              <button key={q.id} onClick={() => selectQuestion(q)} className="block w-full text-left">
                <Card
                  className={`transition hover:shadow-md ${
                    selected?.id === q.id ? "border-blue-400 dark:border-blue-500" : ""
                  }`}
                >
                  <Badge>{q.category}</Badge>
                  <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{q.prompt}</p>
                </Card>
              </button>
            ))}
          </div>

          <div>
            {!selected ? (
              <Card className="flex h-full items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
                Select a question to begin.
              </Card>
            ) : (
              <Card>
                <p className="font-medium text-slate-900 dark:text-slate-100">{selected.prompt}</p>
                {selected.tip && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tip: {selected.tip}</p>
                )}

                <div className="mt-4">
                  <textarea
                    rows={6}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer, or use the mic..."
                    className={inputClass}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {voiceSupported ? (
                    <Button type="button" variant="secondary" onClick={toggleRecording}>
                      {recording ? "Stop recording" : "Record answer"}
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Voice input isn't supported in this browser — try Chrome or Edge.
                    </p>
                  )}
                  <Button type="button" onClick={handleSubmit} disabled={submitting || !answer.trim()}>
                    {submitting ? "Submitting..." : "Get feedback"}
                  </Button>
                </div>

                {configured === false && (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    AI feedback isn't configured on this server — your answer will be saved without feedback.
                  </p>
                )}
                {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
                {feedback && (
                  <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
                    {feedback}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {attempts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent practice</h2>
            <div className="mt-3 space-y-3">
              {attempts.map((a) => (
                <Card key={a.id}>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.question.prompt}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.answer}</p>
                  {a.feedback && (
                    <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">Feedback: {a.feedback}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
