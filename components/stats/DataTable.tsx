interface Column<T> {
 header: string;
 accessor: keyof T | ((row: T) => React.ReactNode);
 align?: 'left' | 'center' | 'right';
 sortable?: boolean;
}

interface DataTableProps<T> {
 data: T[];
 columns: Column<T>[];
 loading?: boolean;
}

export function DataTable<T>({ data, columns, loading }: DataTableProps<T>) {
 if (loading) {
  return (
   <div className="animate-pulse">
    <div className="h-10 bg-gray-200 rounded mb-4"></div>
    <div className="h-10 bg-gray-100 rounded mb-2"></div>
    <div className="h-10 bg-gray-100 rounded mb-2"></div>
    <div className="h-10 bg-gray-100 rounded mb-2"></div>
   </div>
  );
 }

 return (
  <div className="overflow-x-auto">
   <table className="w-full">
    <thead className="bg-gray-50">
     <tr>
      {columns.map((col, idx) => (
       <th
        key={idx}
        className={`px-4 py-3 text-sm font-medium text-gray-700 ${
         col.align === 'right'
          ? 'text-right'
          : col.align === 'center'
          ? 'text-center'
          : 'text-left'
        }`}
       >
        {col.header}
       </th>
      ))}
     </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
     {data.map((row, rowIdx) => (
      <tr key={rowIdx} className="hover:bg-gray-50">
       {columns.map((col, colIdx) => (
        <td
         key={colIdx}
         className={`px-4 py-3 text-sm ${
          col.align === 'right'
           ? 'text-right'
           : col.align === 'center'
           ? 'text-center'
           : 'text-left'
         }`}
        >
         {typeof col.accessor === 'function'
          ? col.accessor(row)
          : String(row[col.accessor] || '-')}
        </td>
       ))}
      </tr>
     ))}
    </tbody>
   </table>
  </div>
 );
}
