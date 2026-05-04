/**
 * Logical “design” pixel size the DesignCanvas stage maps to client coordinates.
 */
export const DESIGN_CANVAS = {
  width: 1440,
  height: 1624,
} as const;

/** Uniform scale so the whole artboard fits in the viewport (equivalent to object-contain). */
export function designCoverScale(viewportW: number, viewportH: number): number {
  return Math.min(
    viewportW / DESIGN_CANVAS.width,
    viewportH / DESIGN_CANVAS.height,
  );
}
