import { redirect } from "next/navigation";

// The old animated splash screen and landing/front screen were removed.
// The app now opens directly on the real scanner via a real server redirect
// (force-dynamic avoids the prerendered 1s meta-refresh flash).
export const dynamic = "force-dynamic";

export default function RootPage() {
  redirect("/scan");
}
