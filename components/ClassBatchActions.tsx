"use client";
import { useEffect, useMemo, useState } from "react";
import type { ClassItem, Student } from "@/app/types/student";
import { getSession } from "@/components/AuthGate";

type Rank = { id: string; name: string; rankOrder: number };
type Region = { id: string; nameQuanKhu: string };
type Unit = {
  id: string;
  name: string;
  parentId: string;
  type: string;
  source: "suDoan" | "luDoan";
};
type UnitRecord = { id: string; nameSuDoan?: string; nameLuDoan?: string; idQuanKhu: string };
type Props = {
  mode: "rank" | "graduation";
  students: Student[];
  classes: ClassItem[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export default function ClassBatchActions({
  mode,
  students,
  classes,
  onClose,
  onSaved,
}: Props) {
  const [classId, setClassId] = useState("");
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rankByStudent, setRankByStudent] = useState<Record<string, string>>(
    {},
  );
  const [gradByStudent, setGradByStudent] = useState<
    Record<
      string,
      { mode: "return" | "transfer"; region: string; unit: string }
    >
  >({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/ranks"),
      fetch("http://localhost:3001/quanKhu"),
      fetch("http://localhost:3001/suDoan"),
      fetch("http://localhost:3001/luDoan"),
    ])
      .then(async ([r, q, sd, ld]) => {
        const [a, b, c, d] = await Promise.all([
          r.json(),
          q.json(),
          sd.json(),
          ld.json(),
        ]);
        setRanks(a);
        setRegions(b);
        setUnits([
          ...(c as UnitRecord[]).map((x) => ({
            id: x.id,
            name: x.nameSuDoan || "",
            parentId: x.idQuanKhu,
            type: "Sư đoàn",
            source: "suDoan" as const,
          })),
          ...(d as UnitRecord[]).map((x) => ({
            id: x.id,
            name: x.nameLuDoan || "",
            parentId: x.idQuanKhu,
            type: "Lữ đoàn",
            source: "luDoan" as const,
          })),
        ]);
      })
      .catch(console.error);
  }, []);
  const classStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          (classId === "all" || String(s.classId) === String(classId)) &&
          !s.graduationStatus,
      ),
    [classId, students],
  );
  const toggleAll = () =>
    setSelected(
      selected.length === classStudents.length
        ? []
        : classStudents.map((s) => s.id),
    );
  const selectedStudents = classStudents.filter((s) => selected.includes(s.id));
  const nextRank = (student: Student) => {
    const current = ranks.find((r) => r.name === student.capBac);
    return current
      ? ranks
          .filter((r) => r.rankOrder > current.rankOrder)
          .sort((a, b) => a.rankOrder - b.rankOrder)[0]
      : undefined;
  };
  const setGrad = (
    id: string,
    patch: Partial<{
      mode: "return" | "transfer";
      region: string;
      unit: string;
    }>,
  ) =>
    setGradByStudent((prev) => ({
      ...prev,
      [id]: { ...{ mode: "return", region: "", unit: "" }, ...prev[id], ...patch },
    }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !selectedStudents.length)
      return alert("Hãy chọn lớp hoặc tất cả lớp và ít nhất một học viên");
    setSaving(true);
    try {
      if (mode === "rank") {
        const session = getSession();
        const requests = selectedStudents
          .filter((s) => rankByStudent[s.id] && rankByStudent[s.id] !== "keep")
          .map((s) => ({
            id: crypto.randomUUID(),
            studentId: s.id,
            studentName: s.name,
            maSoHV: s.maSoHV,
            category: "Học viên",
            currentRank: s.capBac,
            proposedRank: rankByStudent[s.id],
            reason: "Đề nghị nâng cấp theo lớp",
            submittedAt: new Date().toISOString(),
            status: "pending",
            approvalStage: "battalion",
            submittedBy: session?.id,
            submittedByRole: session?.role,
          }));
        if (!requests.length)
          return alert("Chưa chọn cấp bậc mới cho học viên nào");
        await Promise.all(
          requests.map((x) =>
            fetch("http://localhost:3001/rankRequests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(x),
            }),
          ),
        );
        alert(`Đã lập ${requests.length} hồ sơ chờ phê duyệt`);
      } else {
        await Promise.all(
          selectedStudents.map(async (s) => {
            const choice = gradByStudent[s.id] || {
              mode: "return",
              region: "",
              unit: "",
            };
            const originRegion = s.originQuanKhuId || s.quanKhuId || "";
            const originUnit = s.originDonViCap2Id || s.donViCap2Id || "";
            const toRegion =
              choice.mode === "return" ? originRegion : choice.region;
            const toUnit = choice.mode === "return" ? originUnit : choice.unit;
            if (choice.mode === "transfer" && (!toRegion || !toUnit))
              throw new Error(`Chưa chọn nơi mới cho ${s.name}`);
            const patch = {
              graduationStatus: "graduated",
              graduatedAt: new Date().toISOString(),
              originQuanKhuId: originRegion,
              originDonViCap2Id: originUnit,
              quanKhuId: toRegion,
              donViCap2Id: toUnit,
            };
            const result = await fetch(
              `http://localhost:3001/students/${s.id}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
              },
            );
            if (!result.ok) throw new Error("Cập nhật tốt nghiệp thất bại");
            await fetch("http://localhost:3001/graduationTransfers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: crypto.randomUUID(),
                studentId: s.id,
                studentName: s.name,
                maSoHV: s.maSoHV,
                type: choice.mode,
                fromQuanKhuId: s.quanKhuId || "",
                toQuanKhuId: toRegion,
                fromDonViCap2Id: s.donViCap2Id || "",
                toDonViCap2Id: toUnit,
                createdAt: new Date().toISOString(),
              }),
            });
          }),
        );
        alert(`Đã ghi nhận tốt nghiệp cho ${selectedStudents.length} học viên`);
      }
      await onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không thể lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={save}
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "rank"
                ? "Nâng quân hàm theo lớp"
                : "Tốt nghiệp theo lớp"}
            </h2>
            <p className="text-sm text-gray-500">
              Mỗi học viên có thể chọn phương án riêng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-500"
          >
            ×
          </button>
        </div>
        <select
          required
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSelected([]);
          }}
          className="mb-4 w-full rounded-lg border px-3 py-2.5"
        >
          <option value="">-- Chọn lớp --</option>
          <option value="all">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {classStudents.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.length === classStudents.length}
              onChange={toggleAll}
            />{" "}
            Chọn tất cả ({classStudents.length})
          </div>
        )}
        <div className="space-y-2">
          {classStudents.map((s) => (
            <div key={s.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() =>
                    setSelected((p) =>
                      p.includes(s.id)
                        ? p.filter((x) => x !== s.id)
                        : [...p, s.id],
                    )
                  }
                />
                <span className="min-w-48 font-medium">
                  {s.name} ({s.capBac})
                </span>
                {mode === "rank" ? (
                  <select
                    value={rankByStudent[s.id] || nextRank(s)?.name || "keep"}
                    onChange={(e) =>
                      setRankByStudent((p) => ({
                        ...p,
                        [s.id]: e.target.value,
                      }))
                    }
                    className="rounded border px-2 py-1.5"
                  >
                    <option value="keep">Giữ nguyên cấp</option>
                    {ranks
                      .filter((r) => {
                        const n = nextRank(s);
                        return n && r.rankOrder >= n.rankOrder;
                      })
                      .map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <>
                    <select
                      value={(gradByStudent[s.id] || { mode: "return" }).mode}
                      onChange={(e) =>
                        setGrad(s.id, {
                          mode: e.target.value as "return" | "transfer",
                        })
                      }
                      className="rounded border px-2 py-1.5"
                    >
                      <option value="return">Về đơn vị cũ</option>
                      <option value="transfer">Đi nơi mới</option>
                    </select>
                    {gradByStudent[s.id]?.mode === "transfer" && (
                      <>
                        <select
                          value={gradByStudent[s.id].region}
                          onChange={(e) =>
                            setGrad(s.id, { region: e.target.value, unit: "" })
                          }
                          className="rounded border px-2 py-1.5"
                        >
                          <option value="">-- Quân khu mới --</option>
                          {regions.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nameQuanKhu}
                            </option>
                          ))}
                        </select>
                        <select
                          disabled={!gradByStudent[s.id].region}
                          value={gradByStudent[s.id].unit}
                          onChange={(e) =>
                            setGrad(s.id, { unit: e.target.value })
                          }
                          className="rounded border px-2 py-1.5 disabled:bg-gray-100"
                        >
                          <option value="">-- Sư đoàn/Lữ đoàn --</option>
                          {units
                            .filter(
                              (u) => u.parentId === gradByStudent[s.id].region,
                            )
                            .map((u) => (
                              <option
                                key={`${u.source}:${u.id}`}
                                value={`${u.source}:${u.id}`}
                              >
                                {u.type} {u.name}
                              </option>
                            ))}
                        </select>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {classId && !classStudents.length && (
            <p className="py-6 text-center text-gray-500">
              Lớp này không còn học viên đang học.
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Hủy
          </button>
          <button
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu xử lý"}
          </button>
        </div>
      </form>
    </div>
  );
}
