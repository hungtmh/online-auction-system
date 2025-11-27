const DashboardTabs = ({ tabs, activeTab, onChange }) => (
  <nav className="mb-6 grid gap-2 rounded-lg bg-white p-2 shadow-md sm:grid-cols-4">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`rounded-md px-4 py-3 text-sm font-semibold transition ${
          activeTab === tab.id ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:bg-slate-100'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </nav>
)

export default DashboardTabs
