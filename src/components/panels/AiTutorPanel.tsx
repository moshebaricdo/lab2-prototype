import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { SecondaryButton } from "../SecondaryButton";
import { ActionRow } from "../ActionRow";
import { InstructionsDrawer } from "../InstructionsDrawer";

interface AiTutorPanelProps {
  chatMessages: Array<{ role: string; content: string }>;
  setChatMessages: (messages: Array<{ role: string; content: string }>) => void;
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
  
  // Calculate the top padding based on drawer state (always resize mode now)
  const topPadding = drawerIsOpen 
    ? drawerHeight + 40 // Add drawer height plus toggle button height
    : 40; // Just toggle button height

  // Calculate max drawer height based on container and input sizes
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (containerRef.current && inputRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const inputHeight = inputRef.current.clientHeight;
        // Leave some padding (e.g., 32px) between drawer and input
        const calculatedMax = containerHeight - inputHeight - 32;
        setMaxDrawerHeight(calculatedMax);
      }
    };

    calculateMaxHeight();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateMaxHeight);
    return () => window.removeEventListener('resize', calculateMaxHeight);
  }, []);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      // Check if this is the first message
      const isFirstMessage = chatMessages.length === 0;

      if (isFirstMessage) {
        // Add user's first message plus demo conversation
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
        // Just add the user's message
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
    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden" ref={containerRef}>
      {/* Instructions Drawer - Always absolutely positioned for the toggle */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <InstructionsDrawer 
          maxHeight={maxDrawerHeight}
          onHeightChange={setDrawerHeight}
          onOpenChange={setDrawerIsOpen}
        />
      </div>
      
      <ScrollArea className="flex-1 min-h-0 p-0">
        <div className="space-y-2 pb-[8px] px-[8px] gap-[16px]" style={{ paddingTop: `${topPadding}px` }}>
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="space-y-2">
              <div
                className={`flex ${
                  msg.role === "user" ? "justify-end pl-[20px]" : "pr-[20px]"
                }`}
              >
                <div
                  className={`rounded-lg p-3 max-w-full ${
                    msg.role === "user"
                      ? "bg-[#f0f2f5] rounded-br-none"
                      : "bg-[#ebfffe] rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
              {msg.role === "assistant" && (
                <div className="h-[24px]">
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

      <div className="border-t border-[#d4dae1] p-2 bg-[#f0f2f5] shrink-0" ref={inputRef}>
        <div className="bg-white border border-[#b7c1cb] rounded p-2 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#0093a4] focus-within:ring-offset-2 transition-shadow">
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
            className="min-h-[40px] border-0 p-0 resize-none focus-visible:ring-0 placeholder:text-[#96a0aa]"
          />
          <div className="flex items-center justify-between mt-2">
            <SecondaryButton icon={<FontAwesomeIcon icon={faPlus} />}>
              Add File
            </SecondaryButton>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                className={`h-6 w-6 transition-colors ${
                  chatInput.trim()
                    ? "bg-[#9657c7] hover:bg-[#6c468a] text-white"
                    : "bg-[#d4dae1] cursor-not-allowed"
                }`}
                disabled={!chatInput.trim()}
                onClick={handleSendMessage}
              >
                <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}