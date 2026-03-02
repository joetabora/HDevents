export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-72 animate-pulse rounded-xl bg-[#18181B]" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-2xl bg-[#18181B]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#18181B]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[#18181B]" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-[#18181B]" />
    </div>
  );
}
