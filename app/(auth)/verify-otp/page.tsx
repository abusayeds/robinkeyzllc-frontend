import { Suspense } from "react";
import VerifyOtpView from "@/components/auth/VerifyOtpView";

// useSearchParams needs a Suspense boundary, otherwise the production build
// fails while prerendering this route.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpView />
    </Suspense>
  );
}
