import type { ChatAttachment, ChatMessage } from "../../../../types/chat";
import type { AiTutorInputExperiment, MockTutorConfig } from "../../../../types/tutor";

export const SEEDED_TUTOR_USER_MESSAGE =
  "Can you help me improve this page while keeping my brand styling consistent?";

export function buildSeededTutorConversation(firstUserMessage: string): ChatMessage[] {
  return [
    {
      role: "user",
      content: firstUserMessage,
    },
    {
      role: "assistant",
      content:
        "I can help you with that! Let me create a solution for you.\n\nI've analyzed your request and here's what I'll build:\n• A responsive layout with proper spacing\n• Interactive elements with hover states\n• Accessible form controls with proper labels\n• Mobile-optimized design that works on all screen sizes\n\nThe page will follow your existing design system and brand colors. Would you like me to proceed?",
    },
    {
      role: "user",
      content:
        "Yes, that sounds great! Can you make the button colors match my brand identity? I want to make sure everything is consistent with the purple and teal color scheme we're using throughout the app.",
    },
    {
      role: "assistant",
      content:
        "Absolutely! I've updated the button styling to use your brand colors from the design pack:\n\n• Primary buttons: #9657c7 (purple) with hover state #6c468a\n• Secondary buttons: #0093a4 (teal) for accents and CTAs\n• Focus states: 2px teal ring (#0093a4) with 2px offset for accessibility\n• Disabled states: Light gray (#d4dae1) to indicate inactive controls\n\nAll buttons now match your brand identity and include proper transition effects for smooth interactions. I've also ensured the contrast ratios meet WCAG accessibility standards.",
    },
    {
      role: "user",
      content:
        "Perfect! One more thing - can you add some validation to the form fields? I want to make sure users enter valid email addresses and that required fields aren't left empty.",
    },
    {
      role: "assistant",
      content:
        "Great idea! I've added comprehensive form validation:\n\n**Email Validation:**\n• Checks for valid email format (name@domain.com)\n• Shows error message if format is incorrect\n• Real-time validation as user types\n\n**Required Fields:**\n• All required fields marked with asterisks\n• Form can't be submitted until all required fields are filled\n• Clear error messages appear below each field\n• Fields highlight in red when there's an error\n\n**User Experience:**\n• Submit button is disabled until form is valid\n• Success message appears after successful submission\n• Form clears after submission for new entries\n\nThe validation follows best practices and provides helpful feedback to guide users through completing the form correctly.",
    },
    {
      role: "user",
      content:
        "This is looking really good! How do I make the page responsive so it works well on mobile devices too?",
    },
    {
      role: "assistant",
      content:
        "Good news - I've already made the page fully responsive! Here's what adapts at different screen sizes:\n\n**Mobile (< 768px):**\n• Single column layout for better readability\n• Larger touch targets (minimum 44px) for buttons and inputs\n• Simplified navigation with hamburger menu\n• Stacked form fields with full-width inputs\n• Adjusted font sizes for mobile viewing\n\n**Tablet (768px - 1024px):**\n• Two-column grid where appropriate\n• Optimized spacing for tablet viewport\n• Touch-friendly interactive elements\n\n**Desktop (> 1024px):**\n• Multi-column layouts for efficient use of space\n• Hover states and detailed interactions\n• Maximum width constraint (1200px) for readability\n\nI've tested the design at common breakpoints and it provides an optimal experience on all devices. You can test it by resizing your browser window or using the device preview toggle in the toolbar!",
    },
  ];
}

export function buildUploadMockFollowUp(
  attachments: ChatAttachment[],
  inputExperiment: AiTutorInputExperiment,
): ChatMessage | null {
  const uploads = attachments.filter((a) => a.source === "upload");
  if (uploads.length === 0) return null;

  const uploadNames = uploads.map((a) => a.fileName);

  if (inputExperiment === "file-chip-action") {
    return {
      role: "assistant",
      content: `I can see the files you shared! If you'd like to use these images directly in your project, click the + button on each one above to add them. I also see you referenced index.html for context — once the images are in your project, I'll help you wire them into the breed cards.`,
    };
  }

  if (inputExperiment === "tutor-action-card") {
    return {
      role: "assistant",
      content: `Those look great! Before we start coding, would you like me to add these images to your project files? That way we can reference them directly in your HTML.`,
      actionCard: {
        prompt: "Add these files to your project?",
        files: uploadNames,
        status: "pending",
      },
    };
  }

  return null;
}

export const defaultMockTutorConfig: MockTutorConfig = {
  seedConversation: buildSeededTutorConversation,
  buildAttachmentFollowUp: buildUploadMockFollowUp,
};
