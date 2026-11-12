"use client";

import { useEffect, useState } from "react";
import { LESSONS, type AcademyLevel } from "@/lib/content/lessons";
import { quizFor } from "@/lib/content/quizzes";
import { useAcademyStore, type QuizAttempt } from "@/lib/stores/academy-store";
import { useCurrentUser, useSettingsStore } from "@/lib/stores/settings-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LEVELS: AcademyLevel[] = ["beginner", "intermediate", "advanced"];

export default function AcademyPage() {
  const user = useCurrentUser();
  const users = useSettingsStore((s) => s.settings.users);
  const byUser = useAcademyStore((s) => s.byUser);
  const markRead = useAcademyStore((s) => s.markRead);
  const submitQuiz = useAcademyStore((s) => s.submitQuiz);
  const [lessonId, setLessonId] = useState(LESSONS[0].id);
  const [showQuiz, setShowQuiz] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const lesson = LESSONS.find((l) => l.id === lessonId) ?? LESSONS[0];
  const progress = byUser[user.id];
  const attempt = progress?.attempts[lesson.level];

  useEffect(() => {
    markRead(user.id, lesson.id);
  }, [user.id, lesson.id, markRead]);

  useEffect(() => {
    setDraft({});
    setError(null);
  }, [user.id]);

  const openLesson = (id: string) => {
    setLessonId(id);
    setShowQuiz(false);
    setError(null);
    setDraft({});
  };

  const openQuiz = (level: AcademyLevel) => {
    const first = LESSONS.find((l) => l.level === level) ?? LESSONS[0];
    setLessonId(first.id);
    setShowQuiz(true);
    setError(null);
    setDraft({});
  };

  const submit = () => {
    const result = submitQuiz(user.id, lesson.level, draft);
    if ("error" in result) setError(result.error);
    else setError(null);
  };

  return (
    <div>
      <PageHeader
        title="Academy"
        description="Process lessons and a scored check for each level. Progress is stored in this browser for Allan and Alex separately. No market calls."
      />
      <Card className="mb-4">
        <CardContent className="grid gap-3 pt-4 md:grid-cols-2" data-testid="academy-progress">
          {users.map((profile) => {
            const row = byUser[profile.id];
            return (
              <div key={profile.id} className="text-[13px] text-secondary">
                <p className="font-semibold text-primary">
                  {profile.name}
                  {profile.id === user.id ? " · this profile" : ""}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {LEVELS.map((level) => {
                    const done = row?.attempts[level];
                    const read = LESSONS.filter((l) => l.level === level && row?.read.includes(l.id)).length;
                    const total = LESSONS.filter((l) => l.level === level).length;
                    return (
                      <li key={level}>
                        {level}: {read}/{total} lessons
                        {done ? ` · quiz ${done.correct}/${done.total}` : " · quiz not submitted"}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>
      {attempt && showQuiz && (
        <p className="mb-3 text-sm text-secondary" data-testid="academy-result">
          {user.name} scored {attempt.correct} of {attempt.total} on the {lesson.level} quiz. A wrong answer stays the answer that was stored.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardContent className="space-y-3 pt-4">
            {LEVELS.map((level) => (
              <div key={level}>
                <p className="px-2 text-[10px] uppercase tracking-wide text-muted">{level}</p>
                {LESSONS.filter((l) => l.level === level).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => openLesson(l.id)}
                    className={cn(
                      "block w-full rounded-md px-2 py-2 text-left text-[13px]",
                      !showQuiz && l.id === lesson.id ? "bg-accent-soft text-accent" : "text-secondary hover:bg-raised"
                    )}
                  >
                    <span className="block text-[10px] uppercase tracking-wide">{l.module}</span>
                    {l.title}
                  </button>
                ))}
                <button
                  type="button"
                  data-testid={`quiz-${level}`}
                  onClick={() => openQuiz(level)}
                  className={cn(
                    "block w-full rounded-md px-2 py-2 text-left text-[13px]",
                    showQuiz && lesson.level === level ? "bg-accent-soft text-accent" : "text-secondary hover:bg-raised"
                  )}
                >
                  {quizFor(level).title}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
        {showQuiz ? (
          <QuizCard
            level={lesson.level}
            attempt={attempt}
            draft={draft}
            error={error}
            onPick={(questionId, choiceId) => setDraft((d) => ({ ...d, [questionId]: choiceId }))}
            onSubmit={submit}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardDescription>
                {lesson.level} · {lesson.module}
              </CardDescription>
              <CardTitle>{lesson.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-[14px] leading-relaxed text-secondary">{lesson.body}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function QuizCard({
  level,
  attempt,
  draft,
  error,
  onPick,
  onSubmit,
}: {
  level: AcademyLevel;
  attempt?: QuizAttempt;
  draft: Record<string, string>;
  error: string | null;
  onPick: (questionId: string, choiceId: string) => void;
  onSubmit: () => void;
}) {
  const quiz = quizFor(level);
  const locked = attempt?.submitted === true;
  return (
    <Card data-testid="academy-quiz">
      <CardHeader>
        <CardDescription>{level}</CardDescription>
        <CardTitle>{quiz.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quiz.questions.map((question) => {
          const picked = locked ? attempt.answers[question.id] : draft[question.id];
          return (
            <fieldset key={question.id} className="space-y-1">
              <legend className="text-[13px] text-primary">{question.prompt}</legend>
              {question.choices.map((choice) => {
                const selected = picked === choice.id;
                const showWrong = locked && selected && choice.id !== question.correctId;
                const showRight = locked && selected && choice.id === question.correctId;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={locked}
                    data-testid={`choice-${question.id}-${choice.id}`}
                    onClick={() => onPick(question.id, choice.id)}
                    className={cn(
                      "block w-full rounded-md border px-3 py-2 text-left text-[13px]",
                      selected ? "border-accent text-primary" : "border-line text-secondary",
                      showWrong && "border-down/40 text-down",
                      showRight && "border-up/40 text-up"
                    )}
                  >
                    {choice.text}
                    {showWrong && " · your answer, wrong"}
                    {showRight && " · correct"}
                  </button>
                );
              })}
            </fieldset>
          );
        })}
        {error && <p className="text-xs text-down">{error}</p>}
        {locked ? (
          <p className="text-sm text-secondary" data-testid="academy-score">
            Score {attempt.correct} / {attempt.total}. Stored in localStorage for this profile. Wrong choices stay wrong.
          </p>
        ) : (
          <Button data-testid="academy-submit" onClick={onSubmit}>
            Score quiz
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
