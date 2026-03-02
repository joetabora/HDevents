export default function EventLoading() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-[#18181B]" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-[#18181B]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#18181B]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#18181B]" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-[#18181B]" />
    </div>
  );
}
