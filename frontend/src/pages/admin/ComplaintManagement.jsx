import { useNavigate } from "react-router-dom";
import { MessageSquareWarning, ArrowLeft, Clock, ShieldCheck } from "lucide-react";

function ComplaintManagement() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10">
          <MessageSquareWarning
            size={38}
            className="text-indigo-400"
          />
        </div>

        {/* Status */}
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
          <Clock size={15} />
          Coming Soon
        </span>

        {/* Heading */}
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">
          Complaint Management
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-400">
          We're building a centralized space to help administrators
          review passenger and driver complaints, investigate issues,
          and resolve disputes efficiently.
        </p>

        {/* Planned features */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 text-left">
          <h2 className="mb-4 text-sm font-semibold text-gray-200">
            What's coming
          </h2>

          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-indigo-400" />
              Review and investigate complaints
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-indigo-400" />
              Track complaint status and priority
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-indigo-400" />
              Resolve passenger and driver disputes
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={17} className="text-indigo-400" />
              Maintain resolution history
            </li>
          </ul>
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <p className="mt-6 text-xs text-gray-500">
          RideSync Admin Portal
        </p>
      </div>
    </div>
  );
}

export default ComplaintManagement;