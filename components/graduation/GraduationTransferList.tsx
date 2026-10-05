type Student = { id: string; name: string; maSoHV: string };
type Region = { id: string; nameQuanKhu: string };
type Unit = { id: string; name: string; parentId: string; type: string; source: string };
type Destination = { region: string; unit: string };

export function GraduationTransferList({
  students,
  selectedIds,
  destinations,
  onToggle,
  onDestinationChange,
  regions,
  units,
}: {
  students: Student[];
  selectedIds: string[];
  destinations: Record<string, Destination>;
  onToggle: (id: string) => void;
  onDestinationChange: (id: string, patch: Partial<Destination>) => void;
  regions: Region[];
  units: Unit[];
}) {
  return (
    <div>
      {students.map((student) => {
        const destination = destinations[student.id] || { region: "", unit: "" };
        const choices = units.filter((unit) => unit.parentId === destination.region);
        return (
          <div key={student.id} className="border-b p-3 last:border-0 hover:bg-sky-50/50">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                className="mt-1"
                type="checkbox"
                checked={selectedIds.includes(student.id)}
                onChange={() => onToggle(student.id)}
              />
              <span>
                <b>{student.name}</b>
                <span className="ml-2 text-xs text-slate-500">{student.maSoHV}</span>
              </span>
            </label>
            {selectedIds.includes(student.id) && (
              <div className="ml-7 mt-3 grid gap-3 sm:grid-cols-2">
                <select
                  value={destination.region}
                  onChange={(event) =>
                    onDestinationChange(student.id, { region: event.target.value, unit: "" })
                  }
                  className="field-control"
                >
                  <option value="">-- Chọn Quân khu mới --</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>{region.nameQuanKhu}</option>
                  ))}
                </select>
                <select
                  value={destination.unit}
                  disabled={!destination.region}
                  onChange={(event) => onDestinationChange(student.id, { unit: event.target.value })}
                  className="field-control"
                >
                  <option value="">-- Chọn Sư đoàn/Lữ đoàn mới --</option>
                  {choices.map((unit) => (
                    <option key={`${unit.source}:${unit.id}`} value={`${unit.source}:${unit.id}`}>
                      {unit.type} {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
