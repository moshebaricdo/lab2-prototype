import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "../../ui/scroll-area";
import { Textarea } from "../../ui/textarea";
import { AppButton } from "../../ui/AppButton";
import { ActionRow } from "../ActionRow";
import { InstructionsDrawer } from "../InstructionsDrawer";
import type { ChatMessage } from "../../../types/chat";
import styles from "./AiTutorPanel.module.scss";

interface AiTutorPanelProps {
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
}

export function AiTutorPanel({
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
}: AiTutorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [maxDrawerHeight, setMaxDrawerHeight] = useState<number | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [drawerIsOpen, setDrawerIsOpen] = useState(true);

  const topPadding = drawerIsOpen ? drawerHeight + 40 : 40;

  useEffect(() => {
    const calculateMaxHeight = () => {
      if (containerRef.current && inputRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const inputHeight = inputRef.current.clientHeight;
        const calculatedMax = containerHeight - inputHeight - 32;
        setMaxDrawerHeight(calculatedMax);
      }
    };

    calculateMaxHeight();
    window.addEventListener("resize", calculateMaxHeight);
    return () => window.removeEventListener("resize", calculateMaxHeight);
  }, []);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      const isFirstMessage = chatMessages.length === 0;

      if (isFirstMessage) {
        setChatMessages([
          {
            role: "user",
            content: chatInput,
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
        ]);
      } else {
        setChatMessages([
          ...chatMessages,
          {
            role: "user",
            content: chatInput,
          },
        ]);
      }
      setChatInput("");
    }
  };

  return (
    <div className={styles.root} ref={containerRef}>
      <div className={styles.drawerContainer}>
        <InstructionsDrawer
          maxHeight={maxDrawerHeight}
          onHeightChange={setDrawerHeight}
          onOpenChange={setDrawerIsOpen}
        />
      </div>

      <ScrollArea className={styles.messagesArea}>
        <div className={styles.messagesWrap} style={{ paddingTop: `${topPadding}px` }}>
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={styles.messageBlock}>
              <div
                className={`${styles.messageRow} ${
                  msg.role === "user" ? styles.messageRowUser : styles.messageRowAssistant
                }`}
              >
                <div
                  className={`${styles.messageBubble} ${
                    msg.role === "user"
                      ? styles.messageBubbleUser
                      : styles.messageBubbleAssistant
                  }`}
                >
                  <p className={styles.messageText}>{msg.content}</p>
                </div>
              </div>
              {msg.role === "assistant" && (
                <div className={styles.actionRowWrap}>
                  <ActionRow
                    onCopy={() => {
                      console.log("Copy message", idx);
                    }}
                    onDownload={() => {
                      console.log("Download message", idx);
                    }}
                    onThumbsUp={() => {
                      console.log("Thumbs up", idx);
                    }}
                    onThumbsDown={() => {
                      console.log("Thumbs down", idx);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className={styles.inputSection} ref={inputRef}>
        <div className={styles.inputCard}>
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type something..."
            className={styles.textarea}
          />
          <div className={styles.inputActions}>
            <AppButton
              variant="secondary"
              tone="black"
              size="xs"
              icon={<FontAwesomeIcon icon={faPlus} />}
            >
              Add File
            </AppButton>
            <div className={styles.sendButtonRow}>
              <AppButton
                variant="primary"
                tone="purple"
                size="xs"
                icon={<FontAwesomeIcon icon={faArrowUp} className={styles.sendIcon} />}
                className={`${styles.sendButton} ${
                  chatInput.trim()
                    ? styles.sendButtonEnabled
                    : styles.sendButtonDisabled
                }`}
                disabled={!chatInput.trim()}
                onClick={handleSendMessage}
                aria-label="Send message"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
