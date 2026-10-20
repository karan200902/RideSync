function QuickActionCard({ title, description, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-800 bg-gray-900 p-5 text-left transition hover:border-blue-500 hover:bg-gray-800"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-xl text-blue-400">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold text-white">{title}</h3>

          <p className="mt-1 text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default QuickActionCard;
