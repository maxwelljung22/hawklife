export default function ClubWorkspaceLoading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-40 rounded-[1.8rem]" />
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="skeleton h-80 rounded-[1.8rem]" />
        <div className="space-y-5">
          <div className="skeleton h-52 rounded-[1.8rem]" />
          <div className="skeleton h-72 rounded-[1.8rem]" />
          <div className="skeleton h-72 rounded-[1.8rem]" />
        </div>
      </div>
    </div>
  );
}
