import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { aiLanguageName, useI18n } from "../i18n/I18nContext";
import type { InterviewAttempt, InterviewCategory, InterviewQuestion } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge, type BadgeTone } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Markdown } from "../components/ui/Markdown";
import { Skeleton } from "../components/ui/Skeleton";
import { inputClass } from "../components/ui/Field";
import { CheckIcon, ClockIcon, MicIcon, ShuffleIcon, SparklesIcon } from "../components/icons";

const CATEGORIES: (InterviewCategory | "ALL")[] = ["ALL", "BEHAVIORAL", "TECHNICAL", "SITUATIONAL"];

const CATEGORY_TONE: Record<InterviewCategory, BadgeTone> = {
  BEHAVIORAL: "violet",
  TECHNICAL: "blue",
  SITUATIONAL: "amber",
};

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

function scoreFrom(feedback: string | null) {
  const match = feedback ? /Score:\s*(\d+)\s*\/\s*10/i.exec(feedback) : null;
  return match ? Number(match[1]) : null;
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}


export function InterviewPractice() {
  const { t, language, locale } = useI18n();
  const categoryLabel = (c: InterviewCategory | "ALL") => t(`interview.category.${c}`);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [category, setCategory] = useState<InterviewCategory | "ALL">("ALL");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [selected, setSelected] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [attempts, setAttempts] = useState<InterviewAttempt[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [timing, setTiming] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);
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
    setLoadingQuestions(true);
    const query = category === "ALL" ? "" : `?category=${category}`;
    api
      .get<{ questions: InterviewQuestion[] }>(`/interview/questions${query}`)
      .then((res) => setQuestions(res.questions))
      .finally(() => setLoadingQuestions(false));
  }, [category]);

  useEffect(() => {
    if (!timing) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timing]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const practicedIds = new Set(attempts.map((a) => a.question.id));
  const scores = attempts.map((a) => scoreFrom(a.feedback)).filter((s): s is number => s !== null);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const currentScore = scoreFrom(feedback);

  function selectQuestion(q: InterviewQuestion) {
    recognitionRef.current?.stop();
    setSelected(q);
    setAnswer("");
    setFeedback(null);
    setError(null);
    setSeconds(0);
    setTiming(false);
  }

  function randomQuestion() {
    const pool = questions.filter((q) => q.id !== selected?.id);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) selectQuestion(pick);
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
    setTiming(true);
  }

  async function handleSubmit() {
    if (!selected || !answer.trim()) return;
    recognitionRef.current?.stop();
    setTiming(false);
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await api.post<{ feedback: string | null }>("/interview/practice", {
        questionId: selected.id,
        answer: answer.trim(),
        language: aiLanguageName(language),
      });
      setFeedback(res.feedback ?? t("interview.savedNoFeedback"));
      const attemptsRes = await api.get<{ attempts: InterviewAttempt[] }>("/interview/attempts");
      setAttempts(attemptsRes.attempts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("interview.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("interview.title")}
        description={t("interview.description")}
        actions={
          <Button variant="secondary" onClick={randomQuestion} disabled={questions.length === 0}>
            <ShuffleIcon className="h-4 w-4" /> {t("interview.random")}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: t("interview.statPracticed"), value: attempts.length },
          { label: t("interview.statCovered"), value: `${practicedIds.size}` },
          { label: t("interview.statAverage"), value: avgScore },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl dark:text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mb-3 inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  category === c
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>

          {language !== "en" && (
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t("interview.questionLanguageNote")}</p>
          )}
          <div className="space-y-2 lg:max-h-[calc(100vh-18rem)] lg:overflow-y-auto lg:pr-1">
            {loadingQuestions
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)
              : questions.map((q) => {
                  const isSelected = selected?.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => selectQuestion(q)}
                      className={`block w-full rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={CATEGORY_TONE[q.category]}>{categoryLabel(q.category)}</Badge>
                        {practicedIds.has(q.id) && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> {t("interview.practiced")}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">{q.prompt}</p>
                    </button>
                  );
                })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex h-full min-h-[24rem] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <MicIcon className="h-7 w-7" />
              </div>
              <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{t("interview.readyTitle")}</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {t("interview.readyDescription")}
              </p>
              <Button className="mt-5" onClick={randomQuestion} disabled={questions.length === 0}>
                <ShuffleIcon className="h-4 w-4" /> {t("interview.giveMe")}
              </Button>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between gap-3">
                <Badge tone={CATEGORY_TONE[selected.category]}>{categoryLabel(selected.category)}</Badge>
                <span
                  className={`inline-flex items-center gap-1.5 font-mono text-sm ${
                    timing ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <ClockIcon className="h-4 w-4" /> {formatTime(seconds)}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-white">{selected.prompt}</h2>
              {selected.tip && (
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  <span className="font-semibold">{t("interview.tip")}</span> {selected.tip}
                </div>
              )}

              <textarea
                rows={7}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (!timing && !feedback) setTiming(true);
                }}
                placeholder={t("interview.answerPlaceholder")}
                className={`${inputClass} mt-4`}
              />
              <div className="mt-1.5 flex justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>{t("interview.words", { count: wordCount })}</span>
                <span>{t("interview.aim")}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {voiceSupported && (
                  <Button variant={recording ? "danger" : "secondary"} onClick={toggleRecording}>
                    {recording ? (
                      <>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> {t("interview.stopRecording")}
                      </>
                    ) : (
                      <>
                        <MicIcon className="h-4 w-4" /> {t("interview.record")}
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={submitting || !answer.trim()}>
                  <SparklesIcon className="h-4 w-4" />
                  {submitting ? t("interview.analyzing") : t("interview.getFeedback")}
                </Button>
                {!voiceSupported && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t("interview.voiceSupport")}</p>
                )}
              </div>

              {configured === false && (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {t("interview.notConfigured")}
                </p>
              )}
              {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

              {feedback && (
                <div className="animate-pop-in mt-5 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-5 dark:border-blue-500/20 dark:from-blue-500/10 dark:to-violet-500/5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <SparklesIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" /> {t("interview.coachTitle")}
                    </p>
                    {currentScore !== null && (
                      <Badge tone={currentScore >= 8 ? "green" : currentScore >= 5 ? "amber" : "red"}>{currentScore}/10</Badge>
                    )}
                  </div>
                  <Markdown content={feedback} className="text-sm text-slate-700 dark:text-slate-300" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => selectQuestion(selected)}>
                      {t("interview.tryAgain")}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={randomQuestion}>
                      {t("interview.next")}
                    </Button>
                    <Link
                      to="/assistant"
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-500/10"
                    >
                      <SparklesIcon className="h-3.5 w-3.5" /> {t("interview.discuss")}
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {attempts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("interview.history")}</h2>
          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {attempts.map((a) => {
              const s = scoreFrom(a.feedback);
              const open = expandedAttempt === a.id;
              return (
                <div key={a.id}>
                  <button
                    onClick={() => setExpandedAttempt(open ? null : a.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{a.question.prompt}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {categoryLabel(a.question.category)} · {new Date(a.createdAt).toLocaleString(locale)}
                      </p>
                    </div>
                    {s !== null && <Badge tone={s >= 8 ? "green" : s >= 5 ? "amber" : "red"}>{s}/10</Badge>}
                    <span className={`text-slate-400 transition ${open ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {open && (
                    <div className="space-y-3 bg-slate-50/60 px-5 pb-5 pt-1 dark:bg-slate-800/30">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("interview.yourAnswer")}</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{a.answer}</p>
                      </div>
                      {a.feedback && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("interview.feedback")}</p>
                          <Markdown content={a.feedback} className="mt-1 text-sm text-slate-700 dark:text-slate-300" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
