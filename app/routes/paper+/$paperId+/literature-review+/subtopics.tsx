import { invariant } from "@epic-web/invariant";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import * as Ably from "ably";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import {
  createLitReviewSubtopic,
  deleteLitReviewSubtopic,
  generateLitSubtopicBody,
  getLitReviewSubtopics,
  LitReviewSubtopic,
  suggestLitSubtopics,
  updateLitReviewSubtopic,
} from "#app/services/lit-review-subtopics.server";
import { getApiErrorMessage } from "#app/utils/api.utils";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");

  const res = await getLitReviewSubtopics({ paperId, request });
  const ablyKey = process.env.ABLY_KEY ?? "";

  return json({ paperId, subtopics: res.data?.subtopics ?? [], ablyKey });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const paperId = params.paperId;
  invariant(paperId, "Paper ID is required");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "suggest") {
    const res = await suggestLitSubtopics({ paperId, request });
    return json({ titles: res.data?.titles ?? [] });
  }

  if (intent === "add") {
    const title = formData.get("title") as string;
    const order = formData.get("order")
      ? Number(formData.get("order"))
      : undefined;
    await createLitReviewSubtopic({ paperId, title, order, request });
    return json({ message: "Added" });
  }

  if (intent === "add-many") {
    const titlesRaw = formData.get("titles") as string;
    const titles: string[] = JSON.parse(titlesRaw);
    for (let i = 0; i < titles.length; i++) {
      await createLitReviewSubtopic({
        paperId,
        title: titles[i],
        order: i,
        request,
      });
    }
    return json({ message: "Added all" });
  }

  if (intent === "rename") {
    const subtopicId = formData.get("subtopicId") as string;
    const title = formData.get("title") as string;
    await updateLitReviewSubtopic({
      paperId,
      subtopicId,
      data: { title },
      request,
    });
    return json({ message: "Renamed" });
  }

  if (intent === "save-body") {
    const subtopicId = formData.get("subtopicId") as string;
    const body = formData.get("body") as string;
    await updateLitReviewSubtopic({
      paperId,
      subtopicId,
      data: { body },
      request,
    });
    return json({ message: "Saved" });
  }

  if (intent === "delete") {
    const subtopicId = formData.get("subtopicId") as string;
    await deleteLitReviewSubtopic({ paperId, subtopicId, request });
    return json({ message: "Deleted" });
  }

  if (intent === "generate-body") {
    const subtopicId = formData.get("subtopicId") as string;
    const ablyEventName = formData.get("ablyEventName") as string;
    await generateLitSubtopicBody({
      paperId,
      subtopicId,
      ablyEventName,
      request,
    });
    return json({ message: "Generating…" });
  }

  return json({ message: "Unknown intent" });
};

type SubtopicCardProps = {
  subtopic: LitReviewSubtopic;
  index: number;
  paperId: string;
  ablyKey: string;
};

function SubtopicCard({ subtopic, index, paperId, ablyKey }: SubtopicCardProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  const [body, setBody] = useState(subtopic.body ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(subtopic.title);
  const streamRef = useRef("");

  const ablyEventName = `lr-subtopic-${subtopic.id}`;

  // Stream generated body from Ably
  useEffect(() => {
    if (!ablyKey || !isGenerating) return;

    const client = new Ably.Realtime({ key: ablyKey });
    const channel = client.channels.get(`paper-${paperId}`);

    const handler = (message: { data: unknown }) => {
      const data = String(message.data);
      if (data === "[DONE]") {
        const content = streamRef.current.trim();
        if (content) {
          setBody(content);
          // Persist
          const fd = new FormData();
          fd.set("intent", "save-body");
          fd.set("subtopicId", subtopic.id);
          fd.set("body", content);
          fetcher.submit(fd, { method: "post" });
        }
        streamRef.current = "";
        setIsGenerating(false);
        return;
      }
      streamRef.current += data;
      setBody(streamRef.current);
    };

    channel.subscribe(ablyEventName, handler);
    return () => {
      channel.unsubscribe(ablyEventName, handler);
      client.close();
    };
  }, [ablyKey, isGenerating, ablyEventName, paperId, subtopic.id, fetcher]);

  const startGenerate = () => {
    streamRef.current = "";
    setIsGenerating(true);
    const fd = new FormData();
    fd.set("intent", "generate-body");
    fd.set("subtopicId", subtopic.id);
    fd.set("ablyEventName", ablyEventName);
    fetcher.submit(fd, { method: "post" });
  };

  const handleSaveTitle = () => {
    if (titleDraft === subtopic.title) {
      setIsEditingTitle(false);
      return;
    }
    const fd = new FormData();
    fd.set("intent", "rename");
    fd.set("subtopicId", subtopic.id);
    fd.set("title", titleDraft);
    fetcher.submit(fd, { method: "post" });
    setIsEditingTitle(false);
    revalidator.revalidate();
  };

  const handleSaveBody = () => {
    const fd = new FormData();
    fd.set("intent", "save-body");
    fd.set("subtopicId", subtopic.id);
    fd.set("body", body);
    fetcher.submit(fd, { method: "post" });
  };

  const handleDelete = () => {
    const fd = new FormData();
    fd.set("intent", "delete");
    fd.set("subtopicId", subtopic.id);
    fetcher.submit(fd, { method: "post" });
    revalidator.revalidate();
  };

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          {isEditingTitle ? (
            <Group gap="xs" style={{ flex: 1 }}>
              <TextInput
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                size="sm"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setTitleDraft(subtopic.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
              />
              <Button size="xs" variant="filled" onClick={handleSaveTitle}>
                Save
              </Button>
            </Group>
          ) : (
            <Group gap="xs" style={{ flex: 1 }} align="center">
              <Badge variant="light" size="sm">
                3.{index + 1}
              </Badge>
              <Text fw={500} size="sm" style={{ flex: 1 }}>
                {subtopic.title}
              </Text>
              <Tooltip label="Rename">
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => setIsEditingTitle(true)}
                >
                  ✎
                </ActionIcon>
              </Tooltip>
            </Group>
          )}

          <Tooltip label="Remove sub-topic">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={handleDelete}
              loading={fetcher.state !== "idle" && fetcher.formData?.get("intent") === "delete"}
            >
              ✕
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        {/* Body */}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          minRows={6}
          autosize
          size="sm"
          placeholder={
            isGenerating
              ? "Generating…"
              : "Ask Prof Z to generate content for this sub-topic, or write your own."
          }
          disabled={isGenerating}
        />

        <Group justify="flex-end" gap="xs">
          {body && !isGenerating && (
            <Button size="xs" variant="light" onClick={handleSaveBody}>
              Save
            </Button>
          )}
          <Button
            size="xs"
            variant="filled"
            onClick={startGenerate}
            loading={isGenerating}
            disabled={isGenerating}
          >
            {body ? "Regenerate" : "Generate with Prof Z"}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}

export default function LitReviewSubtopicsPage() {
  const { paperId, subtopics: initial, ablyKey } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ titles?: string[]; message?: string }>();
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const [subtopics, setSubtopics] = useState<LitReviewSubtopic[]>(initial);
  const [newTitle, setNewTitle] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);

  // Sync with server data on revalidation
  useEffect(() => {
    setSubtopics(initial);
  }, [initial]);

  // Handle suggest response
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.titles) {
      setSuggestions(fetcher.data.titles);
      setIsSuggesting(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleSuggest = () => {
    setIsSuggesting(true);
    setSuggestions(null);
    const fd = new FormData();
    fd.set("intent", "suggest");
    fetcher.submit(fd, { method: "post" });
  };

  const handleAddNew = () => {
    if (!newTitle.trim()) return;
    const fd = new FormData();
    fd.set("intent", "add");
    fd.set("title", newTitle.trim());
    fetcher.submit(fd, { method: "post" });
    setNewTitle("");
    setTimeout(() => revalidator.revalidate(), 300);
  };

  const handleAcceptSuggestions = () => {
    if (!suggestions) return;
    const fd = new FormData();
    fd.set("intent", "add-many");
    fd.set("titles", JSON.stringify(suggestions));
    fetcher.submit(fd, { method: "post" });
    setSuggestions(null);
    setTimeout(() => revalidator.revalidate(), 500);
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={2}>
          <Title order={4}>Literature Review Sub-topics</Title>
          <Text size="xs" c="dimmed">
            Each sub-topic maps to a 3.N numbered heading in the exported
            proposal. Add your own or let Prof Z suggest them from your Research
            Question.
          </Text>
        </Stack>
        <Button
          size="sm"
          variant="light"
          onClick={() => navigate(`/paper/${paperId}/literature-review`)}
        >
          ← Back to Review
        </Button>
      </Group>

      {/* Suggest Sub-topics */}
      <Card withBorder radius="md" p="md">
        <Stack gap="sm">
          <Text fw={500} size="sm">
            Let Prof Z suggest sub-topics
          </Text>
          <Text size="xs" c="dimmed">
            Prof Z will read your Main Research Question and propose 4–9
            deductive sub-topic titles.
          </Text>

          {suggestions && (
            <Stack gap="xs">
              <Text size="xs" fw={500} c="teal">
                Suggestions (click to add individually or accept all):
              </Text>
              {suggestions.map((s, i) => (
                <Group key={i} gap="xs">
                  <Badge variant="outline" size="sm">
                    {i + 1}
                  </Badge>
                  <Text size="sm" style={{ flex: 1 }}>
                    {s}
                  </Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("intent", "add");
                      fd.set("title", s);
                      fetcher.submit(fd, { method: "post" });
                      setSuggestions((prev) =>
                        prev ? prev.filter((_, idx) => idx !== i) : null
                      );
                      setTimeout(() => revalidator.revalidate(), 300);
                    }}
                  >
                    + Add
                  </Button>
                </Group>
              ))}
              <Group justify="flex-end" mt="xs">
                <Button
                  size="sm"
                  variant="filled"
                  onClick={handleAcceptSuggestions}
                >
                  Accept all
                </Button>
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => setSuggestions(null)}
                >
                  Dismiss
                </Button>
              </Group>
            </Stack>
          )}

          {!suggestions && (
            <Group>
              <Button
                size="sm"
                variant="default"
                onClick={handleSuggest}
                loading={isSuggesting}
              >
                {isSuggesting ? (
                  <>
                    <Loader size="xs" mr="xs" /> Suggesting…
                  </>
                ) : (
                  "Suggest sub-topics"
                )}
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      {/* Manual add */}
      <Group gap="sm">
        <TextInput
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a sub-topic title manually…"
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddNew();
          }}
        />
        <Button
          variant="light"
          onClick={handleAddNew}
          disabled={!newTitle.trim()}
        >
          Add
        </Button>
      </Group>

      {/* Sub-topic list */}
      {subtopics.length === 0 ? (
        <Box ta="center" py="xl">
          <Text c="dimmed" size="sm">
            No sub-topics yet. Use the suggestion tool or add one manually.
          </Text>
        </Box>
      ) : (
        <Stack gap="md">
          {subtopics.map((st, idx) => (
            <SubtopicCard
              key={st.id}
              subtopic={st}
              index={idx}
              paperId={paperId}
              ablyKey={ablyKey}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
