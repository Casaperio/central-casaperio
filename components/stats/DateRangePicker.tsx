interface DateRangePickerProps {
 value: { from: string; to: string };
 onChange: (range: { from: string; to: string }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
 return (
  <div className="flex items-center gap-2 text-sm">
   <label className="text-gray-600">Período:</label>
   <input
    type="date"
    value={value.from}
    onChange={(e) => onChange({ ...value, from: e.target.value })}
    className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
   />
   <span className="text-gray-500">até</span>
   <input
    type="date"
    value={value.to}
    onChange={(e) => onChange({ ...value, to: e.target.value })}
    className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
   />
  </div>
 );
}
