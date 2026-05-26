import Link from "next/link";

export function SupabaseNotice() {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      Supabase is not configured yet. Add your values to <span className="font-semibold">.env.local</span> from{" "}
      <span className="font-semibold">.env.example</span>, then restart the app. You can still review the UI.
      <div className="mt-3">
        <Link href="/pricing" className="font-semibold underline">
          View support page
        </Link>
      </div>
    </div>
  );
}
