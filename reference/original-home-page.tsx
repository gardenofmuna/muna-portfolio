/**
 * Archived copy of the original `/` homepage (Portfolio grid).
 *
 * When the circular About wheel became the site root, this UI moved to:
 *   `/portfolio` → see `app/portfolio/page.tsx`
 *
 * Restore as root by swapping `app/page.tsx` with this component’s body
 * and pointing nav links as needed.
 */
import { PortfolioPage } from "@/components/PortfolioPage";

export default function OriginalHomePage() {
  return <PortfolioPage />;
}
