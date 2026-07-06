import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: `${process.env["DATABASE_URL"]}` });
const prisma = new PrismaClient({ adapter });

const questions = [
  {
    category: "BEHAVIORAL" as const,
    prompt: "Tell me about a time you faced a significant challenge on a project. How did you handle it?",
    tip: "Use the STAR method: Situation, Task, Action, Result. Be specific about your own contribution.",
  },
  {
    category: "BEHAVIORAL" as const,
    prompt: "Describe a time you disagreed with a teammate or professor. How did you resolve it?",
    tip: "Show that you can disagree respectfully and focus on the outcome, not just the conflict.",
  },
  {
    category: "BEHAVIORAL" as const,
    prompt: "Tell me about a time you had to learn something new quickly to complete a task.",
    tip: "Highlight your learning process and resourcefulness, not just the end result.",
  },
  {
    category: "BEHAVIORAL" as const,
    prompt: "Why are you interested in this role, and why this company?",
    tip: "Be specific — connect your background and interests to something concrete about the company.",
  },
  {
    category: "BEHAVIORAL" as const,
    prompt: "Tell me about a time you failed at something. What did you learn?",
    tip: "Pick a real failure, own it honestly, and focus most of your answer on what changed afterward.",
  },
  {
    category: "TECHNICAL" as const,
    prompt: "Walk me through a project on your resume in technical detail. What was your role and what tradeoffs did you make?",
    tip: "Be ready to go deep on one project — interviewers often probe for specifics, not just a summary.",
  },
  {
    category: "TECHNICAL" as const,
    prompt: "How would you design a simple URL shortener? What are the key components?",
    tip: "Think about the data model, the encoding scheme, and how you'd handle collisions or scale.",
  },
  {
    category: "TECHNICAL" as const,
    prompt: "What's the difference between a SQL and NoSQL database, and when would you choose one over the other?",
    tip: "Ground your answer in a real scenario rather than reciting definitions.",
  },
  {
    category: "TECHNICAL" as const,
    prompt: "How do you approach debugging an issue you've never seen before?",
    tip: "Describe a concrete process: reproduce, isolate, hypothesize, test — not just 'I use console.log'.",
  },
  {
    category: "TECHNICAL" as const,
    prompt: "Explain a concept from your coursework or projects to someone non-technical.",
    tip: "This tests communication as much as understanding — avoid jargon entirely.",
  },
  {
    category: "SITUATIONAL" as const,
    prompt: "If you were assigned a task with an unclear deadline and requirements, what would you do first?",
    tip: "Emphasize clarifying questions and proactive communication over guessing.",
  },
  {
    category: "SITUATIONAL" as const,
    prompt: "How would you handle being given feedback you disagree with?",
    tip: "Show you can separate the emotional reaction from evaluating the feedback on its merits.",
  },
  {
    category: "SITUATIONAL" as const,
    prompt: "What would you do if you noticed a teammate was struggling but hadn't asked for help?",
    tip: "Balance empathy with respecting boundaries — offer help without being presumptuous.",
  },
  {
    category: "SITUATIONAL" as const,
    prompt: "How do you prioritize when you have multiple deadlines at the same time?",
    tip: "Give a concrete framework (urgency vs. importance, stakeholder impact) rather than 'I just manage my time well'.",
  },
  {
    category: "SITUATIONAL" as const,
    prompt: "Do you have any questions for us?",
    tip: "Always have 2-3 genuine questions ready — about the team, the work, or growth, not just benefits.",
  },
];

async function main() {
  for (const q of questions) {
    const existing = await prisma.interviewQuestion.findFirst({ where: { prompt: q.prompt } });
    if (!existing) {
      await prisma.interviewQuestion.create({ data: q });
    }
  }
  console.log(`Seeded ${questions.length} interview questions (skipping duplicates).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
