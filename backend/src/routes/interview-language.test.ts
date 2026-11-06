import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, signUp } from "../test/helpers.js";
import { prisma } from "../lib/prisma.js";
import { QUESTION_TRANSLATIONS } from "../lib/interview-translations.js";

const BUILT_IN = "Do you have any questions for us?";

beforeEach(async () => {
  await resetDatabase();
  await prisma.interviewQuestion.createMany({
    data: [
      { category: "SITUATIONAL", prompt: BUILT_IN, tip: "Always have 2-3 genuine questions ready." },
      { category: "TECHNICAL", prompt: "A question an admin wrote", tip: null },
    ],
  });
});

describe("interview questions in the chosen language", () => {
  it("are translated for every supported language", async () => {
    const { agent } = await signUp();
    for (const lang of ["ja", "zh", "es", "de", "my"] as const) {
      const { body } = await agent.get(`/api/interview/questions?lang=${lang}`).expect(200);
      const question = body.questions.find((q: { category: string }) => q.category === "SITUATIONAL");
      expect(question).toMatchObject({ prompt: QUESTION_TRANSLATIONS[BUILT_IN]![lang]!.prompt, translated: true });
      expect(question.tip).toBe(QUESTION_TRANSLATIONS[BUILT_IN]![lang]!.tip);
    }
  });

  it("stay in English, marked untranslated, when there's no translation", async () => {
    const { agent } = await signUp();
    const { body } = await agent.get("/api/interview/questions?lang=ja").expect(200);
    expect(body.questions.find((q: { category: string }) => q.category === "TECHNICAL")).toMatchObject({
      prompt: "A question an admin wrote",
      translated: false,
    });
  });

  it("default to English, and ignore unknown languages", async () => {
    const { agent } = await signUp();
    for (const query of ["", "?lang=xx"]) {
      const { body } = await agent.get(`/api/interview/questions${query}`).expect(200);
      expect(body.questions.map((q: { prompt: string }) => q.prompt)).toContain(BUILT_IN);
    }
  });

  it("also translate the question in past attempts", async () => {
    const { agent, user } = await signUp();
    const question = await prisma.interviewQuestion.findFirstOrThrow({ where: { prompt: BUILT_IN } });
    await prisma.interviewAttempt.create({ data: { questionId: question.id, userId: user.id, answer: "Yes" } });

    const { body } = await agent.get("/api/interview/attempts?lang=ja").expect(200);
    expect(body.attempts[0].question.prompt).toBe(QUESTION_TRANSLATIONS[BUILT_IN]!.ja!.prompt);
  });
});

it("has a translation in every language for every built-in question", async () => {
  // Keeps the translations in step with the seed: a reworded seed prompt would silently fall back to English.
  const seed = await import("node:fs").then((fs) => fs.readFileSync(new URL("../../prisma/seed-interview-questions.ts", import.meta.url), "utf8"));
  const prompts = [...seed.matchAll(/prompt: "((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`) as string);
  expect(prompts.length).toBeGreaterThan(10);
  for (const prompt of prompts) {
    for (const lang of ["ja", "zh", "es", "de", "my"] as const) {
      expect(QUESTION_TRANSLATIONS[prompt]?.[lang]?.prompt, `${lang}: ${prompt}`).toBeTruthy();
    }
  }
});
