import type { AcademyLevel } from "@/lib/content/lessons";

export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  correctId: string;
}

export interface LevelQuiz {
  level: AcademyLevel;
  title: string;
  questions: QuizQuestion[];
}

export const QUIZZES: LevelQuiz[] = [
  {
    level: "beginner",
    title: "Beginner check",
    questions: [
      {
        id: "b1",
        prompt: "What should decide the size of a paper trade?",
        choices: [
          { id: "conviction", text: "How sure you feel about the idea" },
          { id: "stop", text: "Equity, risk percent, and stop distance" },
          { id: "last", text: "Whatever size the last trade used" },
        ],
        correctId: "stop",
      },
      {
        id: "b2",
        prompt: "A quote labeled delayed means",
        choices: [
          { id: "live", text: "It is a live exchange tape" },
          { id: "delayed", text: "It is not a live tape, even if the number looks fresh" },
          { id: "forecast", text: "It is a forecast of the next print" },
        ],
        correctId: "delayed",
      },
      {
        id: "b3",
        prompt: "If the terminal has no quote, it should",
        choices: [
          { id: "invent", text: "Fill the order at the last number you typed" },
          { id: "reject", text: "Refuse the fill and say the quote is missing" },
          { id: "zero", text: "Fill at 0 so the book still updates" },
        ],
        correctId: "reject",
      },
    ],
  },
  {
    level: "intermediate",
    title: "Intermediate check",
    questions: [
      {
        id: "i1",
        prompt: "What belongs in a journal note before the outcome is known?",
        choices: [
          { id: "pnl", text: "Only the P&L" },
          { id: "decision", text: "The setup, invalidation, and emotion" },
          { id: "score", text: "A confidence score from the analyzer" },
        ],
        correctId: "decision",
      },
      {
        id: "i2",
        prompt: "Win rate tells you",
        choices: [
          { id: "profit", text: "That the account is profitable" },
          { id: "not", text: "How often trades won, which is not the same as profitability" },
          { id: "r", text: "The average R of the sample" },
        ],
        correctId: "not",
      },
      {
        id: "i3",
        prompt: "Profit factor is",
        choices: [
          { id: "wins", text: "Win count divided by loss count" },
          { id: "gross", text: "Gross winning P&L divided by absolute gross losing P&L" },
          { id: "equity", text: "Ending equity divided by starting balance" },
        ],
        correctId: "gross",
      },
    ],
  },
  {
    level: "advanced",
    title: "Advanced check",
    questions: [
      {
        id: "a1",
        prompt: "Analyzer language is",
        choices: [
          { id: "forecast", text: "A forecast of the next move" },
          { id: "scenario", text: "If/then scenarios, not a promised outcome" },
          { id: "signal", text: "An order signal" },
        ],
        correctId: "scenario",
      },
      {
        id: "a2",
        prompt: "A scanner hit is",
        choices: [
          { id: "prediction", text: "A prediction that price will continue" },
          { id: "heuristic", text: "A heuristic match against rules, not a prediction" },
          { id: "fill", text: "A paper fill" },
        ],
        correctId: "heuristic",
      },
      {
        id: "a3",
        prompt: "When bars are missing, a study should",
        choices: [
          { id: "invent", text: "Invent the missing bars so the pattern can print" },
          { id: "unavailable", text: "Say unavailable" },
          { id: "score", text: "Show a confidence score anyway" },
        ],
        correctId: "unavailable",
      },
    ],
  },
];

export function quizFor(level: AcademyLevel): LevelQuiz {
  const quiz = QUIZZES.find((q) => q.level === level);
  if (!quiz) throw new Error(`Missing quiz for ${level}`);
  return quiz;
}
