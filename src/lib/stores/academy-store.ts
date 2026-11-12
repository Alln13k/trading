"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AcademyLevel } from "@/lib/content/lessons";
import { quizFor } from "@/lib/content/quizzes";

export interface QuizAttempt {
  answers: Record<string, string>;
  submitted: true;
  correct: number;
  total: number;
  score: number;
  submittedAt: number;
}

interface UserProgress {
  read: string[];
  attempts: Partial<Record<AcademyLevel, QuizAttempt>>;
}

interface AcademyState {
  byUser: Record<string, UserProgress>;
  markRead: (userId: string, lessonId: string) => void;
  submitQuiz: (
    userId: string,
    level: AcademyLevel,
    answers: Record<string, string>
  ) => QuizAttempt | { error: string };
}

function emptyProgress(): UserProgress {
  return { read: [], attempts: {} };
}

export function scoreQuiz(level: AcademyLevel, answers: Record<string, string>): QuizAttempt | { error: string } {
  const quiz = quizFor(level);
  for (const question of quiz.questions) {
    const picked = answers[question.id];
    if (!picked || !question.choices.some((c) => c.id === picked)) {
      return { error: "Answer every question before scoring." };
    }
  }
  let correct = 0;
  const locked: Record<string, string> = {};
  for (const question of quiz.questions) {
    locked[question.id] = answers[question.id];
    if (answers[question.id] === question.correctId) correct += 1;
  }
  return {
    answers: locked,
    submitted: true,
    correct,
    total: quiz.questions.length,
    score: correct / quiz.questions.length,
    submittedAt: Date.now(),
  };
}

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      byUser: {},
      markRead: (userId, lessonId) =>
        set((s) => {
          const prev = s.byUser[userId] ?? emptyProgress();
          if (prev.read.includes(lessonId)) return s;
          return {
            byUser: {
              ...s.byUser,
              [userId]: { ...prev, read: [...prev.read, lessonId] },
            },
          };
        }),
      submitQuiz: (userId, level, answers) => {
        const existing = get().byUser[userId]?.attempts[level];
        if (existing?.submitted) return existing;
        const scored = scoreQuiz(level, answers);
        if ("error" in scored) return scored;
        set((s) => {
          const prev = s.byUser[userId] ?? emptyProgress();
          return {
            byUser: {
              ...s.byUser,
              [userId]: {
                ...prev,
                attempts: { ...prev.attempts, [level]: scored },
              },
            },
          };
        });
        return scored;
      },
    }),
    { name: "trading-academy-v1" }
  )
);
