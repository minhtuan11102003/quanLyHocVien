type Student = {
  id: string;
  name: string;
  maSoHV: string;
  classId: string;
  originQuanKhuId?: string;
  originDonViCap2Id?: string;
  quanKhuId?: string;
  donViCap2Id?: string;
};
type Destination = { region: string; unit: string };

export function GraduationReturnList({
  students,
  selectedIds,
  onToggle,
  regionName,
  unitName,
  oldDestination,
}: {
  students: Student[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  regionName: (id?: string) => string;
  unitName: (id?: string) => string;
  oldDestination: (student: Student) => Destination;
}) {
  return (
    <div>
      {students.map((student) => {
        const destination = oldDestination(student);
        return (
          <label
            key={student.id}
            className="flex cursor-pointer items-start gap-3 border-b p-3 last:border-0 hover:bg-emerald-50/50"
          >
            <input
              className="mt-1"
              type="checkbox"
              checked={selectedIds.includes(student.id)}
              onChange={() => onToggle(student.id)}
            />
            <span className="min-w-0 flex-1">
              <b>{student.name}</b>
              <span className="ml-2 text-xs text-slate-500">
                {student.maSoHV}
              </span>
              <span className="mt-1 block text-xs text-slate-600">
                Sau tốt nghiệp: {regionName(destination.region)} /{" "}
                {unitName(destination.unit)}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
