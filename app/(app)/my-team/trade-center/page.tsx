import { Suspense } from "react";
import TradeCenterPage from "@/components/trade-center/TradeCenterPage";

// The page reads the player and team the Trade Finder sends over in the URL,
// and useSearchParams needs a Suspense boundary or the production build fails
// while prerendering this route. Same as /verify-otp.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <TradeCenterPage />
    </Suspense>
  );
}
