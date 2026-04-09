import { useEffect, useRef, useState } from "react";

interface ResizableHandleProps {
  onResize: (delta: number) => void;
  orientation?: "vertical" | "horizontal";
}

export function ResizableHandle({
  onResize,
  orientation = "vertical",
}: ResizableHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const startPosRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta =
        orientation === "vertical"
          ? e.clientX - startPosRef.current
          : e.clientY - startPosRef.current;
      startPosRef.current =
        orientation === "vertical" ? e.clientX : e.clientY;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onResize, orientation]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current =
      orientation === "vertical" ? e.clientX : e.clientY;
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative shrink-0 ${
        orientation === "vertical"
          ? "w-0 cursor-col-resize"
          : "h-0 cursor-row-resize"
      } ${isDragging ? "z-50" : "z-10"}`}
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
            ? `top-0 bottom-0 left-0 ${isHovering || isDragging ? "w-[3px] -ml-[1.5px]" : "w-[1px] -ml-[0.5px]"}`
            : `left-0 right-0 top-0 ${isHovering || isDragging ? "h-[3px] -mt-[1.5px]" : "h-[1px] -mt-[0.5px]"}`
        }`}
      />
    </div>
  );
}
