import type { ChatMessage } from "../../../../../types/chat";

function roleLabel(role: ChatMessage["role"]) {
  return role === "user" ? "User" : "AI";
}

function formatMessageExtras(message: ChatMessage): string[] {
  const extras: string[] = [];

  if (message.attachments?.length) {
    const names = message.attachments
      .map((attachment) => attachment.path || attachment.fileName)
      .join(", ");
    extras.push(`Attachments: ${names}`);
  }

  if (message.editOptions?.status === "pending") {
    extras.push("Edit direction options");
  }

  if (message.newProjectPlanQuestionnaire) {
    const { status, answers } = message.newProjectPlanQuestionnaire;
    if (status === "answered" && answers) {
      extras.push(
        `Project plan questionnaire (answered): idea="${answers.projectIdea}", audience="${answers.audience}", interaction="${answers.coreInteraction}", style="${answers.visualStyle}"`,
      );
    } else {
      extras.push("Project plan questionnaire");
    }
  }

  if (message.validationReview) {
    const { kind, title, items } = message.validationReview;
    const itemSummary =
      items?.map((item) => `${item.label} (${item.status})`).join("; ") ?? "";
    extras.push(
      `Validation review (${kind}${title ? `: ${title}` : ""}${itemSummary ? ` — ${itemSummary}` : ""})`,
    );
  }

  if (message.fileChanges?.length) {
    const changes = message.fileChanges
      .map((change) => `${change.fileName} (${change.status})`)
      .join(", ");
    extras.push(`File changes: ${changes}`);
  }

  if (message.actionCard) {
    extras.push(`Action card: ${message.actionCard.prompt}`);
  }

  if (message.codeChangeStatus) {
    extras.push(`Code change status: ${message.codeChangeStatus}`);
  }

  if (message.isAlert) {
    extras.push(`System alert (${message.alertVariant ?? "success"})`);
  }

  return extras;
}

export function formatChatLogTranscript(messages: ChatMessage[]) {
  const blocks: string[] = [];

  for (const message of messages) {
    const lines = [`[${roleLabel(message.role)}]`];
    const extras = formatMessageExtras(message);

    for (const extra of extras) {
      lines.push(extra);
    }

    const content = message.content.trim();
    if (content) {
      lines.push(content);
    } else if (extras.length === 0) {
      lines.push("(No message text)");
    }

    blocks.push(lines.join("\n"));
  }

  return blocks.join("\n\n");
}

export function downloadChatLog(
  messages: ChatMessage[],
  filename = "ai-tutor-chat-log.txt",
) {
  if (typeof window === "undefined" || messages.length === 0) return;

  const transcript = formatChatLogTranscript(messages);
  const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
