import { SkarenMark } from "@/components/SkarenLogo";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center px-6 pb-28 pt-24">
      <div className="text-center">
        <SkarenMark className="mx-auto h-20 w-20 rounded-[1.7rem]" iconClassName="h-11 w-11 text-white" />
        <p className="mt-5 font-display text-3xl font-black tracking-[-0.04em] text-ink">Skaren</p>
        <div className="skeleton-shimmer mx-auto mt-5 h-3 w-36 rounded-full bg-white/70" />
      </div>
    </main>
  );
}
