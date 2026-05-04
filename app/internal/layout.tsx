import type { ReactNode } from "react";
import { ARTBOARD_HEIGHT, ARTBOARD_WIDTH } from "@/lib/artboard";

/**
 * Iframe document: pin :root to artboard pixels so `100vh` / `100vw` match the comp.
 */
export default function InternalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root, html, body {
              margin: 0;
              padding: 0;
              width: ${ARTBOARD_WIDTH}px;
              height: ${ARTBOARD_HEIGHT}px;
              max-width: ${ARTBOARD_WIDTH}px;
              max-height: ${ARTBOARD_HEIGHT}px;
              overflow: hidden;
              box-sizing: border-box;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
