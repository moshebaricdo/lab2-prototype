import { useRef, useState } from "react";

interface ResizableHandleProps {
  onResize: (delta: number) => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function ResizableHandle({
  onResize,
  orientation = "vertical",
  className = "",
}: ResizableHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef(0);

  const getPointerPosition = (event: React.PointerEvent<HTMLDivElement>) =>
    orientation === "vertical" ? event.clientX : event.clientY;

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    startPosRef.current = getPointerPosition(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const nextPosition = getPointerPosition(event);
    const delta = nextPosition - startPosRef.current;
    if (delta === 0) return;

    startPosRef.current = nextPosition;
    onResize(delta);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    endDrag(event);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    endDrag(event);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative shrink-0 touch-none ${
        orientation === "vertical"
          ? "w-0 cursor-col-resize"
          : "h-0 cursor-row-resize"
      } ${isDragging ? "z-50" : "z-10"} ${className}`}
    >
      <div
        className={`absolute ${
          orientation === "vertical"
            ? "top-0 bottom-0 -left-1 -right-1 w-2"
            : "left-0 right-0 -top-1 -bottom-1 h-2"
        }`}
      />

      <div
        className={`absolute bg-[#d4dae1] transition-all ${
          orientation === "vertical"
            ? `top-0 bottom-0 left-1/2 -translate-x-1/2 ${isHovering || isDragging ? "w-[3px]" : "w-px"}`
            : `left-0 right-0 top-1/2 -translate-y-1/2 ${isHovering || isDragging ? "h-[3px]" : "h-px"}`
        }`}
      />
    </div>
  );
}
