/** Wheel labels that open a full page on mobile, and the address each shows. */
export const NARROW_PAGE_PATHS = {
  about: "/about",
  contact: "/contact",
  photos: "/photos",
  "cv + press": "/cv",
  installation: "/installation",
} as const;

export type NarrowPage = keyof typeof NARROW_PAGE_PATHS;

export function isNarrowPage(label: string): label is NarrowPage {
  return Object.prototype.hasOwnProperty.call(NARROW_PAGE_PATHS, label);
}

export function narrowPageForPath(pathname: string): NarrowPage | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  for (const page of Object.keys(NARROW_PAGE_PATHS) as NarrowPage[]) {
    if (NARROW_PAGE_PATHS[page] === path) return page;
  }
  return null;
}
