import { useEffect, useRef, useState, type FormEvent, type Ref } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  CornerDownRight,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { Analysis, Comparison, DimensionStatus } from "@/lib/coach.functions";

export type CoachServices = {
  analyze: (input: { goal: string; draft: string }) => Promise<Analysis>;
  compare: (input: { goal: string; draft: string; revision: string }) => Promise<Comparison>;
};
type Stage = "draft" | "refine" | "reflect";
const MAX_PROMPT = 1200;
const STAGES: { id: Stage; title: string; note: string }[] = [
  { id: "draft", title: "Draft", note: "Start with your words" },
  { id: "refine", title: "Refine", note: "Put feedback into practice" },
  { id: "reflect", title: "Reflect", note: "See what changed" },
];
const ANATOMY = [
  {
    name: "Goal",
    question: "What do you want to understand?",
    text: "Explain how Python while loops work.",
    note: "Name the specific thing you want to learn, rather than a whole subject.",
  },
  {
    name: "Context",
    question: "What should the coach know?",
    text: "I’m a first-year student and I know basic variables.",
    note: "A little background helps the response meet you at the right level.",
  },
  {
    name: "Constraints",
    question: "What are the boundaries?",
    text: "Use plain English. Guide me without solving my homework.",
    note: "Set useful limits: difficulty, language, length or the kind of help you want.",
  },
  {
    name: "Output",
    question: "What would useful help look like?",
    text: "Give me one simple example, then a question to try myself.",
    note: "Ask for a format that helps you learn: steps, an analogy or a practice question.",
  },
];

function statusLabel(status: DimensionStatus) {
  return status === "Missing"
    ? "Not specified"
    : status === "Needs work"
      ? "Partly clear"
      : "Clear";
}

export function PromptCoach({ analyze, compare }: CoachServices) {
  const [stage, setStage] = useState<Stage>("draft");
  const [goal, setGoal] = useState("");
  const [draft, setDraft] = useState("");
  const [revision, setRevision] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState<"analyze" | "compare" | null>(null);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<"goal" | "draft" | "revision" | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const goalInput = useRef<HTMLInputElement>(null);
  const draftInput = useRef<HTMLTextAreaElement>(null);
  const revisionInput = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(copyTimer.current);
    };
  }, []);

  function navigate(next: Stage) {
    setStage(next);
    setError("");
    setFieldError(null);
    setResetOpen(false);
    requestAnimationFrame(() => stageHeading.current?.focus({ preventScroll: false }));
  }

  function invalidateFeedback() {
    setAnalysis(null);
    setComparison(null);
    setCopied(false);
    setError("");
    setFieldError(null);
  }

  function invalid(field: "goal" | "draft" | "revision", message: string) {
    setError(message);
    setFieldError(field);
    ({ goal: goalInput, draft: draftInput, revision: revisionInput })[field].current?.focus();
  }

  async function onAnalyze(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (goal.trim().length < 3)
      return invalid(
        "goal",
        "Add a specific learning goal, such as understanding Python while loops.",
      );
    if (draft.trim().length < 10)
      return invalid(
        "draft",
        "Write a short prompt of at least 10 characters so there is something to coach.",
      );
    setError("");
    setFieldError(null);
    setBusy("analyze");
    setAnnouncement("Reading your prompt. Your feedback will open when it is ready.");
    try {
      const result = await analyze({ goal: goal.trim(), draft: draft.trim() });
      if (!alive.current) return;
      setAnalysis(result);
      setComparison(null);
      setCopied(false);
      setAnnouncement("Feedback ready. Read the feedback, then write your own revision.");
      navigate("refine");
    } catch {
      if (alive.current) {
        setError(
          "The coach couldn’t respond. Your writing is still here. Check your connection and try again; the AI service may be temporarily unavailable.",
        );
        setAnnouncement("Feedback could not be loaded.");
      }
    } finally {
      if (alive.current) setBusy(null);
    }
  }

  async function onCompare(event: FormEvent) {
    event.preventDefault();
    if (busy || !analysis) return;
    if (revision.trim().length < 10)
      return invalid(
        "revision",
        "Write your revision first—at least 10 characters, in your own words.",
      );
    if (revision.trim() === draft.trim())
      return invalid(
        "revision",
        "Your revision is the same as your draft. Try applying one piece of feedback before comparing.",
      );
    setError("");
    setFieldError(null);
    setBusy("compare");
    setAnnouncement("Comparing your draft and revision.");
    try {
      const result = await compare({
        goal: goal.trim(),
        draft: draft.trim(),
        revision: revision.trim(),
      });
      if (!alive.current) return;
      setComparison(result);
      setAnnouncement("Comparison ready. Explore what changed and your next step.");
      navigate("reflect");
    } catch {
      if (alive.current) {
        setError(
          "The comparison couldn’t load. Your revision is still here. Check your connection and try again; the AI service may be temporarily unavailable.",
        );
        setAnnouncement("Comparison could not be loaded.");
      }
    } finally {
      if (alive.current) setBusy(null);
    }
  }

  function useExample() {
    setGoal("Understand Python while loops");
    setDraft("Help me learn Python.");
    setRevision("");
    invalidateFeedback();
    setAnnouncement("Example loaded. You can edit it or get feedback.");
    draftInput.current?.focus();
  }

  function reset() {
    setGoal("");
    setDraft("");
    setRevision("");
    invalidateFeedback();
    clearTimeout(copyTimer.current);
    navigate("draft");
    setAnnouncement("New practice started. Your previous writing has been cleared.");
    requestAnimationFrame(() => goalInput.current?.focus());
  }

  async function copyExample() {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis.example);
      setCopied(true);
      setAnnouncement("Example copied. Use it as a guide, then write your own revision.");
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setAnnouncement("Copying is unavailable. Select the example text to copy it manually.");
    }
  }

  const currentIndex = STAGES.findIndex((item) => item.id === stage);
  const hasWriting = Boolean(goal || draft || revision);

  return (
    <div className="pc-app">
      <a href="#practice" className="pc-skip">
        Skip to practice
      </a>
      <header className="pc-nav pc-shell">
        <a className="pc-brand" href="#" aria-label="Prompt Coach home">
          <span className="pc-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Prompt<span>Coach</span>
        </a>
        <a className="pc-about-link" href="#about">
          About this exercise <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </header>

      <main className="pc-shell">
        <section className="pc-intro" aria-labelledby="page-title">
          <div>
            <p className="pc-eyebrow">A little practice. A better question.</p>
            <h1 id="page-title">
              Better prompts.
              <br />
              <span>Deeper learning.</span>
            </h1>
          </div>
          <p className="pc-intro-note">
            Start with a rough prompt. Get thoughtful feedback.
            <br className="pc-desktop-break" /> Make it better, in your own words.
            <span>For students learning to work with AI.</span>
          </p>
        </section>

        <section id="practice" className="pc-workbench" aria-label="Prompt practice">
          <div className="pc-workbench-bar">
            <ol className="pc-progress" aria-label="Practice stages">
              {STAGES.map((item, i) => (
                <li
                  key={item.id}
                  className={
                    i === currentIndex ? "is-current" : i < currentIndex ? "is-complete" : ""
                  }
                >
                  <button
                    type="button"
                    aria-current={item.id === stage ? "step" : undefined}
                    disabled={
                      busy !== null ||
                      (item.id === "refine" && !analysis) ||
                      (item.id === "reflect" && !comparison)
                    }
                    onClick={() => navigate(item.id)}
                  >
                    <span className="pc-step-number" aria-hidden="true">
                      {i < currentIndex ? <Check size={14} /> : i + 1}
                    </span>
                    <span>
                      {item.title}
                      <small>{item.note}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {hasWriting && (
              <button
                className="pc-reset"
                type="button"
                aria-label="Start over"
                disabled={busy !== null}
                onClick={() => setResetOpen(!resetOpen)}
                aria-expanded={resetOpen}
                aria-controls="reset-confirm"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Start over</span>
              </button>
            )}
          </div>

          {resetOpen && (
            <div id="reset-confirm" className="pc-reset-confirm">
              <p>Start a new practice? This will clear your draft, feedback and revision.</p>
              <div>
                <button type="button" className="pc-button pc-button-small" onClick={reset}>
                  Clear and start again
                </button>
                <button
                  type="button"
                  className="pc-text-button"
                  onClick={() => setResetOpen(false)}
                >
                  Keep practising
                </button>
              </div>
            </div>
          )}

          <div key={stage} className={`pc-stage pc-stage-${stage}`}>
            {stage === "draft" && (
              <>
                <section className="pc-editor" aria-labelledby="stage-title">
                  <div className="pc-section-heading">
                    <p className="pc-kicker">Your starting point</p>
                    <h2 id="stage-title" ref={stageHeading} tabIndex={-1}>
                      What are you working on?
                    </h2>
                    <p>No perfect wording needed. That’s what practice is for.</p>
                  </div>
                  <form noValidate onSubmit={onAnalyze} aria-busy={busy === "analyze"}>
                    <div className="pc-field">
                      <label htmlFor="goal">
                        Your learning goal <span>Required</span>
                      </label>
                      <input
                        id="goal"
                        ref={goalInput}
                        value={goal}
                        disabled={busy !== null}
                        maxLength={300}
                        required
                        placeholder="e.g. Understand Python while loops"
                        aria-invalid={fieldError === "goal"}
                        aria-describedby={fieldError === "goal" ? "practice-error" : "goal-hint"}
                        onChange={(event) => {
                          setGoal(event.target.value);
                          invalidateFeedback();
                        }}
                      />
                      <p id="goal-hint" className="pc-field-hint">
                        What would you like to understand or be able to do?
                      </p>
                    </div>
                    <div className="pc-field">
                      <label htmlFor="draft">
                        Your first prompt <span>Required</span>
                      </label>
                      <div className="pc-writing-area">
                        <textarea
                          id="draft"
                          ref={draftInput}
                          value={draft}
                          disabled={busy !== null}
                          required
                          maxLength={MAX_PROMPT}
                          rows={6}
                          placeholder="Write what you would ask an AI tool…"
                          aria-invalid={fieldError === "draft"}
                          aria-describedby={
                            fieldError === "draft"
                              ? "practice-error draft-counter"
                              : "draft-counter"
                          }
                          onChange={(event) => {
                            setDraft(event.target.value);
                            invalidateFeedback();
                          }}
                        />
                        <div className="pc-writing-footer">
                          <span>A rough draft is a good start.</span>
                          <span id="draft-counter">{draft.length.toLocaleString()} / 1,200</span>
                        </div>
                      </div>
                    </div>
                    {error && (
                      <p id="practice-error" className="pc-error" role="alert">
                        {error}
                      </p>
                    )}
                    <div className="pc-form-actions">
                      <button className="pc-button" type="submit" disabled={busy !== null}>
                        {busy === "analyze" ? (
                          <>
                            <LoaderCircle className="pc-spin" size={17} aria-hidden="true" />
                            Reading your prompt…
                          </>
                        ) : (
                          <>
                            Get feedback
                            <ArrowRight size={17} aria-hidden="true" />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="pc-text-button"
                        disabled={busy !== null}
                        onClick={useExample}
                      >
                        Try an example <CornerDownRight size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <p className="pc-privacy-note">
                      <ShieldCheck size={15} aria-hidden="true" />
                      Your text is sent to an AI service. Leave out personal or confidential
                      information.
                    </p>
                  </form>
                </section>
                <PromptAnatomy />
              </>
            )}

            {stage === "refine" && analysis && (
              <>
                <FeedbackPanel
                  analysis={analysis}
                  headingRef={stageHeading}
                  onWrite={() => revisionInput.current?.focus()}
                />
                <section className="pc-editor" aria-labelledby="stage-title">
                  <div className="pc-section-heading">
                    <p className="pc-kicker">Make it your own</p>
                    <h2 id="stage-title" tabIndex={-1}>
                      A second draft. A clearer ask.
                    </h2>
                    <p>Read the coach’s feedback, then try one or two changes in your own words.</p>
                  </div>
                  <div className="pc-goal-summary">
                    <span>Learning goal</span>
                    <p>{goal}</p>
                  </div>
                  <details className="pc-details">
                    <summary>
                      Your original prompt <ChevronDown size={16} aria-hidden="true" />
                    </summary>
                    <p className="pc-prompt-text">{draft}</p>
                  </details>
                  <form noValidate onSubmit={onCompare} aria-busy={busy === "compare"}>
                    <div className="pc-field">
                      <label htmlFor="revision">
                        Your revision <span>Required</span>
                      </label>
                      <div className="pc-writing-area">
                        <textarea
                          id="revision"
                          ref={revisionInput}
                          value={revision}
                          disabled={busy !== null}
                          required
                          rows={8}
                          maxLength={MAX_PROMPT}
                          placeholder="Keep what works. Add what’s missing. Write it your way."
                          aria-invalid={fieldError === "revision"}
                          aria-describedby={
                            fieldError === "revision"
                              ? "practice-error revision-counter"
                              : "revision-counter"
                          }
                          onChange={(event) => {
                            setRevision(event.target.value);
                            setComparison(null);
                            setError("");
                            setFieldError(null);
                          }}
                        />
                        <div className="pc-writing-footer">
                          <span>Small, thoughtful changes count.</span>
                          <span id="revision-counter">
                            {revision.length.toLocaleString()} / 1,200
                          </span>
                        </div>
                      </div>
                    </div>
                    {error && (
                      <p id="practice-error" className="pc-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button type="submit" className="pc-button" disabled={busy !== null}>
                      {busy === "compare" ? (
                        <>
                          <LoaderCircle className="pc-spin" size={17} aria-hidden="true" />
                          Comparing your prompts…
                        </>
                      ) : (
                        <>
                          Compare my revision
                          <ArrowRight size={17} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>
                  <details className="pc-details pc-coach-example">
                    <summary>
                      Need a model to learn from? <ChevronDown size={16} aria-hidden="true" />
                    </summary>
                    <p className="pc-field-hint">
                      This is one possible prompt, not an answer to your assignment. Try your own
                      wording first.
                    </p>
                    <p className="pc-prompt-text">{analysis.example}</p>
                    <button type="button" className="pc-text-button" onClick={copyExample}>
                      {copied ? (
                        <Check size={15} aria-hidden="true" />
                      ) : (
                        <Copy size={15} aria-hidden="true" />
                      )}
                      {copied ? "Copied" : "Copy example"}
                    </button>
                  </details>
                </section>
              </>
            )}

            {stage === "reflect" && comparison && (
              <>
                <section className="pc-editor" aria-labelledby="stage-title">
                  <div className="pc-section-heading">
                    <p className="pc-kicker">Your practice, side by side</p>
                    <h2 id="stage-title" ref={stageHeading} tabIndex={-1}>
                      Notice the difference.
                    </h2>
                    <p>Which change makes your request easier to understand?</p>
                  </div>
                  <div className="pc-goal-summary">
                    <span>Learning goal</span>
                    <p>{goal}</p>
                  </div>
                  <div className="pc-prompt-version">
                    <h3>
                      <span>1</span>Your first draft
                    </h3>
                    <p className="pc-prompt-text">{draft}</p>
                  </div>
                  <div className="pc-prompt-version pc-revised-version">
                    <h3>
                      <span>2</span>Your revision
                    </h3>
                    <p className="pc-prompt-text">{revision}</p>
                  </div>
                  <button
                    type="button"
                    className="pc-text-button"
                    onClick={() => navigate("refine")}
                  >
                    Keep refining <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </section>
                <aside className="pc-feedback pc-reflection" aria-labelledby="reflection-title">
                  <div className="pc-panel-heading">
                    <p className="pc-kicker">Take the learning with you</p>
                    <h2 id="reflection-title">What changed?</h2>
                    <p>Compare the coach’s observations with your own.</p>
                  </div>
                  <ul className="pc-change-list">
                    {comparison.improved.map((text, i) => (
                      <li key={i}>
                        <Check size={17} aria-hidden="true" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <section className="pc-feedback-note">
                    <h3>Room to develop</h3>
                    <p>{comparison.remainingGap}</p>
                  </section>
                  <section className="pc-takeaway">
                    <span className="pc-takeaway-icon" aria-hidden="true">
                      <ArrowUpRight size={23} />
                    </span>
                    <p className="pc-kicker">For your next prompt</p>
                    <h3>One thing to try.</h3>
                    <p>{comparison.nextTip}</p>
                  </section>
                  <p className="pc-reflection-question">
                    Before you move on: could you explain why your revision is different, without
                    the coach’s help?
                  </p>
                </aside>
              </>
            )}
          </div>
          <div className="pc-workbench-footer">
            <span>
              <span className="pc-small-dot" aria-hidden="true" />
              Practice, don’t outsource.
            </span>
            <span>The coach reviews your prompt—not your homework.</span>
          </div>
        </section>
        <div className="pc-sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        <section id="about" className="pc-about" aria-labelledby="about-title">
          <div className="pc-about-intro">
            <p className="pc-kicker">Designed for learning</p>
            <h2 id="about-title">A coach, not a shortcut.</h2>
            <p>
              For college and university students taking their first steps with AI. Practise asking
              for explanations and guidance, instead of finished answers.
            </p>
            <a
              className="pc-sdg-link"
              href="https://sdgs.un.org/goals/goal4"
              target="_blank"
              rel="noreferrer"
            >
              <span className="pc-sdg-number">4</span>
              <span>
                Quality education<small>Supporting UN Sustainable Development Goal 4</small>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className="pc-sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <div className="pc-about-notes">
            <details className="pc-details">
              <summary>
                How does this support learning? <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>
                Drafting, revising and reflecting gives you guided practice in AI literacy. This
                supports the skills focus of SDG 4; it does not solve unequal access to education.
                Learning impact still needs testing with students.
              </p>
            </details>
            <details className="pc-details">
              <summary>
                What should I keep private? <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>
                Your goal and prompts are sent to an AI service for feedback. Don’t include names,
                student numbers, passwords, personal details or confidential course material. There
                is no account or saved history in this app; this does not mean the AI provider never
                retains data.
              </p>
            </details>
            <details className="pc-details">
              <summary>
                What are the limitations? <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>
                AI feedback can be mistaken or inconsistent. Treat it as a suggestion, not an
                objective score. This interface is in English and needs internet access and an
                available AI service. It may work less well with other languages or unfamiliar
                subjects. Follow your course’s AI rules and disclose help where required.
              </p>
            </details>
          </div>
        </section>
      </main>
      <footer className="pc-footer pc-shell">
        <span>Prompt Coach</span>
        <span>A small exercise in asking better questions.</span>
        <span>AI for Good · Hackathon 01</span>
      </footer>
    </div>
  );
}

function FeedbackPanel({
  analysis,
  headingRef,
  onWrite,
}: {
  analysis: Analysis;
  headingRef: Ref<HTMLHeadingElement>;
  onWrite: () => void;
}) {
  return (
    <aside className="pc-feedback" aria-labelledby="feedback-title">
      <div className="pc-panel-heading">
        <p className="pc-kicker">Coach’s notes</p>
        <h2 id="feedback-title" ref={headingRef} tabIndex={-1}>
          Four ways to make it clearer.
        </h2>
        <p>AI guidance, not a grade. Use what helps.</p>
      </div>
      <div className="pc-dimensions">
        {analysis.dimensions.map((dimension, i) => (
          <article
            className="pc-dimension"
            key={dimension.name}
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div>
              <h3>{dimension.name}</h3>
              <span
                className={`pc-status ${dimension.status === "Clear" ? "is-clear" : dimension.status === "Needs work" ? "is-partial" : "is-missing"}`}
              >
                <span aria-hidden="true">{dimension.status === "Clear" ? "✓" : "·"}</span>
                {statusLabel(dimension.status)}
              </span>
            </div>
            <p>{dimension.explanation}</p>
          </article>
        ))}
      </div>
      <section className="pc-feedback-note">
        <h3>Keep doing this</h3>
        <ul>
          {analysis.works.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      </section>
      <section className="pc-feedback-note pc-next-note">
        <h3>Try changing this</h3>
        <ul>
          {analysis.improve.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      </section>
      <button type="button" className="pc-text-button" onClick={onWrite}>
        Write my revision <ArrowRight size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}

function PromptAnatomy() {
  const [active, setActive] = useState(0);
  return (
    <aside className="pc-anatomy" aria-labelledby="anatomy-title">
      <div className="pc-panel-heading">
        <p className="pc-kicker">A prompt, unpacked</p>
        <h2 id="anatomy-title">
          Good questions have
          <br />a little structure.
        </h2>
        <p>Explore the four ingredients. You don’t need to get them all right the first time.</p>
      </div>
      <div className="pc-anatomy-tabs" aria-label="Explore prompt ingredients">
        {ANATOMY.map((item, i) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <blockquote className="pc-annotated-prompt" aria-label="Example learning prompt">
        {ANATOMY.map((item, i) => (
          <span key={item.name} className={active === i ? "is-highlighted" : ""}>
            {item.text}{" "}
          </span>
        ))}
      </blockquote>
      <div className="pc-annotation-note" key={active} aria-live="polite">
        <span className="pc-annotation-line" aria-hidden="true" />
        <p className="pc-kicker">{ANATOMY[active].name}</p>
        <h3>{ANATOMY[active].question}</h3>
        <p>{ANATOMY[active].note}</p>
      </div>
      <div className="pc-anatomy-caption">
        <span aria-hidden="true">↳</span> An example to learn from, not a formula to memorise.
      </div>
    </aside>
  );
}
