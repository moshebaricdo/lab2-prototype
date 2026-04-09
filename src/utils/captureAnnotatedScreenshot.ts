import { toPng } from "html-to-image";
import type { DrawingShape } from "../hooks/useAnnotations";

/**
 * Capture a full-page screenshot with drawing annotations composited on top.
 * Comment pins and the toolbar are excluded — those are exported as text via the prompt.
 */
export async function captureAnnotatedScreenshot(
  shapes: DrawingShape[],
): Promise<Blob> {
  const hideSelectors = [
    "[data-annotation-pin]",
    "[data-annotation-toolbar]",
    "[data-annotation-overlay]",
    "[data-annotation-popover]",
    "[data-annotation-drawing]",
  ];

  const hidden: Element[] = [];
  const savedVisibility: string[] = [];
  for (const sel of hideSelectors) {
    document.querySelectorAll(sel).forEach((el) => {
      hidden.push(el);
      const htmlEl = el as HTMLElement | SVGElement;
      savedVisibility.push(htmlEl.style.visibility);
      htmlEl.style.visibility = "hidden";
    });
  }

  let pageDataUrl: string;
  try {
    pageDataUrl = await toPng(document.body, {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: 2,
      filter: (node) => {
        if (node instanceof Element && node.hasAttribute("data-annotation-drawing")) {
          return false;
        }
        return true;
      },
    });
  } finally {
    hidden.forEach((el, i) => {
      (el as HTMLElement | SVGElement).style.visibility = savedVisibility[i];
    });
  }

  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const pageImg = await loadImage(pageDataUrl);
  ctx.drawImage(pageImg, 0, 0, window.innerWidth, window.innerHeight);

  const drawColor = "#e53e3e";
  const drawFill = "rgba(229, 62, 62, 0.08)";

  for (const shape of shapes) {
    const pts = shape.points;
    if (pts.length < 2) continue;

    ctx.save();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (shape.type === "rectangle") {
      const x = Math.min(pts[0].x, pts[1].x);
      const y = Math.min(pts[0].y, pts[1].y);
      const w = Math.abs(pts[1].x - pts[0].x);
      const h = Math.abs(pts[1].y - pts[0].y);

      ctx.fillStyle = drawFill;
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
    } else if (shape.type === "arrow") {
      const start = pts[0];
      const end = pts[1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = 14;
      ctx.fillStyle = drawColor;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle - Math.PI / 6),
        end.y - headLen * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        end.x - headLen * Math.cos(angle + Math.PI / 6),
        end.y - headLen * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
    } else if (shape.type === "freeform") {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Download the screenshot as a file. */
export async function downloadAnnotatedScreenshot(
  shapes: DrawingShape[],
): Promise<void> {
  const blob = await captureAnnotatedScreenshot(shapes);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `annotation-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
