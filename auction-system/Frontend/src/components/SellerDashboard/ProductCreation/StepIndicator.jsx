const StepIndicator = ({ step }) => (
  <div className="mb-6 flex items-center justify-center gap-6 text-sm font-semibold">
    {[1, 2].map((value) => (
      <div key={value} className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            step === value ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          {value}
        </span>
        <p className="hidden sm:block">
          {value === 1 ? 'Nhập thông tin sản phẩm' : 'Xác nhận & đăng sản phẩm'}
        </p>
      </div>
    ))}
  </div>
)

export default StepIndicator
