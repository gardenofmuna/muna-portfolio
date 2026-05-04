"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  DESIGN_CANVAS,
  designCoverScale,
} from "@/lib/design-canvas";

export type DesignCanvasContextValue = {
  stageRef: RefObject<HTMLDivElement | null>;
  /** Map viewport client coordinates into design-layer coordinates. */
  clientToDesign: (clientX: number, clientY: number) => { x: number; y: number };
};

const DesignCanvasContext = createContext<DesignCanvasContextValue | null>(
  null,
);

export function useDesignCanvas(): DesignCanvasContextValue | null {
  return useContext(DesignCanvasContext);
}

type Props = {
  children: ReactNode;
  /** Fills letterbox/pillarbox outside the scaled stage */
  className?: string;
};

export function DesignCanvas({ children, className }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      setScale(
        designCoverScale(window.innerWidth, window.innerHeight),
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const clientToDesign = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) {
      return { x: 0, y: 0 };
    }
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * DESIGN_CANVAS.width;
    const y = ((clientY - r.top) / r.height) * DESIGN_CANVAS.height;
    return { x, y };
  }, []);

  const value = useMemo(
    () => ({ stageRef, clientToDesign }),
    [clientToDesign],
  );

  return (
    <DesignCanvasContext.Provider value={value}>
      <div
        className={`fixed inset-0 z-0 overflow-hidden bg-[#eeece4] ${className ?? ""}`}
      >
        <div
          ref={stageRef}
          className="absolute left-1/2 top-1/2 bg-[#eeece4]"
          style={{
            width: DESIGN_CANVAS.width,
            height: DESIGN_CANVAS.height,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
    </DesignCanvasContext.Provider>
  );
}
