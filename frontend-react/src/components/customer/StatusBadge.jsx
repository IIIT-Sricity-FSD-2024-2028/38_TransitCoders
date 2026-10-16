export default function StatusBadge({ status }) {
    const s = (status || "").toLowerCase();

    let colorClass = "bg-amber-50 text-amber-600 border-amber-200";
    if (s.includes("deliver")) {
        colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (s.includes("cancel")) {
        colorClass = "bg-red-50 text-red-600 border-red-200";
    } else if (s.includes("transit") || s.includes("out")) {
        colorClass = "bg-orange-50 text-orange-600 border-orange-200";
    } else if (s.includes("assign")) {
        colorClass = "bg-blue-50 text-blue-600 border-blue-200";
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
            {status || "Pending"}
        </span>
    );
}
