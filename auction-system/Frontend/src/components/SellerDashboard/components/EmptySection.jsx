const EmptySection = ({ message }) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500">
    <p className="text-lg font-semibold">Đang phát triển</p>
    <p className="mt-2 text-sm">{message}</p>
  </div>
)

export default EmptySection
