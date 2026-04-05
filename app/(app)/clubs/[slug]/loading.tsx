export default function ClubLoading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-[23rem] rounded-[2rem]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-72 rounded-[1.8rem]" />
        <div className="skeleton h-72 rounded-[1.8rem]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-80 rounded-[1.8rem]" />
        <div className="skeleton h-80 rounded-[1.8rem]" />
      </div>
    </div>
  );
}
