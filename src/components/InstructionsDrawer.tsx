import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faChevronDown, faChevronUp, faCaretUp } from "@fortawesome/free-solid-svg-icons";

interface InstructionsDrawerProps {
  maxHeight?: number | null;
  onHeightChange?: (height: number) => void; // Callback when drawer height changes
  onOpenChange?: (isOpen: boolean) => void; // Callback when drawer open state changes
}

export function InstructionsDrawer({ maxHeight: propMaxHeight, onHeightChange, onOpenChange }: InstructionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [height, setHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const [contentMaxHeight, setContentMaxHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Notify parent when open state changes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);
  
  // Notify parent when height changes (initial mount and when resized)
  useEffect(() => {
    if (onHeightChange && isOpen) {
      onHeightChange(height);
    }
  }, [height, isOpen, onHeightChange]);

  // Measure content height and set max height constraint
  useEffect(() => {
    if (isOpen && contentRef.current && contentMaxHeight === null) {
      // Get the natural height of the content plus padding
      const contentHeight = contentRef.current.scrollHeight + 16; // 16px for the padding
      setContentMaxHeight(contentHeight);
    }
  }, [isOpen, contentMaxHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      // Use the smaller of content max height or container max height
      const containerMax = propMaxHeight || window.innerHeight - 200;
      const contentMax = contentMaxHeight || window.innerHeight - 200;
      const upperLimit = Math.min(containerMax, contentMax);
      const newHeight = Math.max(150, Math.min(startHeight + deltaY, upperLimit));
      setHeight(newHeight);
      if (onHeightChange) {
        onHeightChange(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="relative flex flex-col items-center pointer-events-none">
      {/* Drawer Content - Only shown when open */}
      {isOpen && (
        <div className="w-full pointer-events-auto relative">
          <div className="bg-white w-full relative shrink-0" data-name="Drawer Content" style={{ height: `${height}px` }}>
            <div aria-hidden="true" className="absolute border-[#d4dae1] border-[0px] border-solid inset-0 pointer-events-none" />
            <div className="p-[8px] h-full">
              {/* Scrollable area with rounded corners */}
              <div className="h-full overflow-y-auto rounded-[4px] bg-white flex flex-col gap-[6px]" ref={contentRef}>
                {/* Card 1: Main Instructions */}
                <div className="bg-[#f0f2f5] rounded-[4px] w-full p-[12px] flex flex-col gap-[6px]" data-name="Main Instructions Card">
                  {/* Heading */}
                  <div className="w-full text-[#292f36] text-[28px]"
                    style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--font-weight-semibold)" }}>
                    <p className="leading-[35.84px]">Style Your Webpage to Match Your Brand Identity</p>
                  </div>
                  
                  {/* Goal description */}
                  <div className="w-full text-[#292f36] text-[14px]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
                    <p className="leading-[21.56px]">Your goal is to apply your brand's colors and fonts to create a consistent, professional look across the entire page.</p>
                  </div>
                  
                  {/* Make sure to: */}
                  <div className="w-full text-[#292f36] text-[14px]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
                    <p className="leading-[21.56px]">Make sure to:</p>
                  </div>
                  
                  {/* Bullet list */}
                  <div className="w-full text-[#292f36] text-[14px]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
                    <ul className="list-disc">
                      <li className="mb-0 ms-[21px]">
                        <span className="leading-[21.56px]">Add the html file as context and prompt the AI to update the file with a link to the stylesheet.</span>
                      </li>
                      <li className="ms-[21px]">
                        <span className="leading-[21.56px]">Fine-tune specific elements of your webpage so every detail aligns with your brand's look and feel.</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Brand kit note */}
                  <div className="w-full text-[#292f36]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-semibold)" }}>
                    <p className="leading-[21.56px] text-[14px]">
                      <span>Don't have your own brand identity kit? </span>
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>Attach one from the sample_brand_kits folder to your chat with AI.</span>
                    </p>
                  </div>
                </div>
                
                {/* Card 2: Helpful Steps */}
                <div className="bg-[#f0f2f5] rounded-[4px] w-full p-[12px] flex flex-col gap-[6px]" data-name="Helpful Steps Card">
                  {/* Helpful Steps Container */}
                  <div className="flex gap-[4px] items-center w-full text-[#292f36]" data-name="Helpful Steps Container">
                    <div className="shrink-0 text-[13px] w-[16px]"
                      style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
                      <FontAwesomeIcon icon={faCaretUp} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-[14px]"
                      style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-semibold)" }}>
                      <p className="leading-[21.56px]">Helpful Steps</p>
                    </div>
                  </div>
                  
                  {/* Numbered list */}
                  <div className="w-full text-[#292f36] text-[14px]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
                    <ol className="list-decimal" start={1}>
                      <li className="mb-0 ms-[21px]">
                        <span className="leading-[21.56px]">Generate the Initial Style and save as V1.</span>
                      </li>
                      <li className="mb-0 ms-[21px]">
                        <span className="leading-[21.56px]">Make Specific Refinement Prompts. Use targeted prompts to give the AI clear styling instructions, such as:</span>
                      </li>
                      <ul className="list-disc mb-0">
                        <li className="mb-0 ms-[42px]">
                          <span className="leading-[21.56px]">"Style the main heading with font [X]."</span>
                        </li>
                        <li className="mb-0 ms-[42px]">
                          <span className="leading-[21.56px]">"Change the button background to our secondary color and add a hover effect."</span>
                        </li>
                        <li className="ms-[42px]">
                          <span className="leading-[21.56px]">"Make the footer text smaller and light gray."</span>
                        </li>
                      </ul>
                      <li className="ms-[21px]">
                        <span className="leading-[21.56px]">Save as Version 2</span>
                      </li>
                    </ol>
                  </div>
                </div>
                
                {/* Card 3: Pro Tips */}
                <div className="bg-[#f0f2f5] rounded-[4px] w-full p-[12px] flex flex-col gap-[6px]" data-name="Pro Tips Card">
                  <div className="w-full text-[#292f36] text-[14px]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-semibold)" }}>
                    <p className="leading-[21.56px]">Pro Tips</p>
                  </div>
                  
                  <div className="w-full text-[#292f36] text-[14px]"
                    style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
                    <ul className="list-disc">
                      <li className="mb-0 ms-[21px]">
                        <span className="leading-[21.56px]">Test your styles in the preview panel to see changes in real-time</span>
                      </li>
                      <li className="mb-0 ms-[21px]">
                        <span className="leading-[21.56px]">Use version history to compare different styling approaches</span>
                      </li>
                      <li className="ms-[21px]">
                        <span className="leading-[21.56px]">Remember: consistency across all elements creates a professional appearance</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resize handle at bottom of white drawer */}
            <div 
              onMouseDown={handleMouseDown}
              onMouseEnter={() => setIsHoveringHandle(true)}
              onMouseLeave={() => setIsHoveringHandle(false)}
              className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-end"
              style={{ zIndex: 10 }}
            >
              <div 
                className={`w-full bg-[#d4dae1] transition-all ${
                  isHoveringHandle || isResizing ? "h-[3px]" : "h-0"
                }`}
              />
            </div>
            
            {/* Full bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#d4dae1] pointer-events-none" />
          </div>
        </div>
      )}
      
      {/* Drawer Toggle - Always visible, overlaps by -1px when open */}
      <div className={`bg-white box-border content-stretch flex flex-col gap-[10px] items-center justify-center pb-[4px] px-[4px] relative rounded-bl-[8px] rounded-br-[8px] shrink-0 pointer-events-auto ${isOpen ? 'pt-0 mt-[-1px]' : 'pt-[3px] mt-[0px] mb-[-1px]'}`} data-name="Drawer Toggle">
        <div aria-hidden="true" className={`absolute border-[#d4dae1] border-[0px_1px_1px_1px] border-solid inset-0 pointer-events-none rounded-bl-[8px] rounded-br-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]`} />
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="box-border content-stretch flex gap-[4px] items-center justify-center min-w-[24px] not-italic px-[8px] py-[2px] relative rounded-[4px] shrink-0 text-[#292f36] text-center hover:bg-[#f0f2f5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0093a4] focus-visible:ring-offset-2" 
          data-name="Button"
        >
          <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[13px] w-[16px]"
            style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
            <FontAwesomeIcon icon={faCircleInfo} className="w-4 h-4" />
          </div>
          <p className="basis-0 grow leading-[19.68px] min-h-px min-w-px relative shrink-0 text-[12px]"
            style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-semibold)" }}>
            {isOpen ? "Hide Instructions" : "Show Instructions"}
          </p>
          <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[13px] w-[16px]"
            style={{ fontFamily: "var(--font-body)", fontWeight: "var(--font-weight-normal)" }}>
            <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}