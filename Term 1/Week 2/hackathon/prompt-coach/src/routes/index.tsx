// Replace src/routes/index.tsx with this file when syncing to Lovable.
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PromptCoach } from "@/components/prompt-coach";
import { analyzePrompt, comparePrompts } from "@/lib/coach.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Coach — Better prompts. Deeper learning." },
      {
        name: "description",
        content:
          "Practise writing better AI prompts. Get feedback, make your own revision and see what changed. A learning exercise for beginner students.",
      },
      { property: "og:title", content: "Prompt Coach — Better prompts. Deeper learning." },
      {
        property: "og:description",
        content:
          "A small exercise in asking better questions. Draft, refine and reflect with AI-powered coaching.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ConnectedPromptCoach,
});
function ConnectedPromptCoach() {
  const analyze = useServerFn(analyzePrompt);
  const compare = useServerFn(comparePrompts);
  return (
    <PromptCoach analyze={(data) => analyze({ data })} compare={(data) => compare({ data })} />
  );
}
