
export default function AdminTable({
    columns,
    data,
    isLoading,
    loadingMessage = "Loading...",
    emptyMessage = "No data available",
    error
}) {
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-t border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {
                            columns.map((col, index) => (
                                <th key={index} className={`py-3 px-6 ${col.headerAlign || ''}`}>
                                    {col.header}
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                        {
                            isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-20 text-gray-400">
                                        {loadingMessage}
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-20 text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-20 text-gray-400 font-normal">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, rowIndex) => (
                                    <tr key={row.id || rowIndex} className="hover:bg-gray-50/70 transition-colors">
                                        {
                                            columns.map((col, colIndex) => (
                                                <td key={colIndex} className={`py-3.5 px-6 ${col.cellClassName || ''}`}>
                                                    {col.render ? col.render(row) : row[col.accessor]}
                                                </td>
                                            ))
                                        }
                                    </tr>
                                ))
                            )
                        }
                </tbody>
            </table>
        </div>
    )
}