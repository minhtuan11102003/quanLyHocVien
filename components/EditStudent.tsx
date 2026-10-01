/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import StudentProfileExtraFields from "@/components/StudentProfileExtraFields";
import { emptyStudentProfileExtra, type StudentProfileExtra } from "@/app/types/student";

type Student = {
  id: string;
  maSoHV: string;
  name: string;
  majorId: string;
  classId: number | string;
  donVi: string;
  chucVu: string;
  danToc: string;
  birthDay: string;
  capBac: string;
  quanKhuId: string;
  donViCap2Id: string;
  tieuDoanId?: string;
  daiDoiId?: string;
  originQuanKhuId?: string;
  originDonViCap2Id?: string;
  [key: string]: unknown;
};

type Major = { id: number | string; name: string; shortName: string };

type ClassItem = {
  id: number | string;
  majorId: number | string;
  name: string;
  daiDoiId?: string;
};

type EditStudentProps = {
  student: Student;
  onClose: () => void;
  onUpdate: (student: Student) => void;
};
type NamedUnit = { id: string; idQuanKhu: string; nameSuDoan?: string; nameLuDoan?: string };

export default function EditStudentComponent({
  student,
  onClose,
  onUpdate,
}: EditStudentProps) {
  const [name, setName] = useState(student.name);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [ranks, setRanks] = useState<
    { id: string; name: string; rankOrder: number }[]
  >([]);
  const [selectedMajor, setSelectedMajor] = useState(String(student.majorId));
  const [selectedClass, setSelectedClass] = useState(String(student.classId));
  const [selectedDonVi, setSelectedDonVi] = useState(student.donVi);
  const [selectedChucVu, setSelectedChucVu] = useState(student.chucVu);
  const [selectedDanToc, setSelectedDanToc] = useState(student.danToc);
  const [birthDay, setBirthDay] = useState(student.birthDay);
  const [selectedCapBac, setSelectedCapBac] = useState(student.capBac);
  const [loading, setLoading] = useState(false);
  const [quanKhu, setQuanKhu] = useState<{ id: string; nameQuanKhu: string }[]>(
    [],
  );
  const [subUnits, setSubUnits] = useState<
    {
      id: string;
      name: string;
      parentId: string;
      type: string;
      source: string;
    }[]
  >([]);
  const [selectedQuanKhu, setSelectedQuanKhu] = useState(
    student.quanKhuId || "",
  );
  const [selectedSubUnit, setSelectedSubUnit] = useState(
    student.donViCap2Id || "",
  );
  const [tieuDoan, setTieuDoan] = useState<
    { id: string; nameTieuDoan: string }[]
  >([]);
  const [daiDoi, setDaiDoi] = useState<
    { id: string; nameDaiDoi: string; idTieuDoan: string }[]
  >([]);
  const [chucVuList, setChucVuList] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedTieuDoan, setSelectedTieuDoan] = useState(
    student.tieuDoanId || "",
  );
  const [selectedDaiDoi, setSelectedDaiDoi] = useState(student.daiDoiId || "");
  const [extra, setExtra] = useState<StudentProfileExtra>(() => ({ ...emptyStudentProfileExtra, ...student }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          majorRes,
          classRes,
          rankRes,
          quanKhuRes,
          suDoanRes,
          luDoanRes,
          tdRes,
          ddRes,
          cvRes,
        ] = await Promise.all([
          fetch("http://localhost:3001/majors"),
          fetch("http://localhost:3001/classes"),
          fetch("http://localhost:3001/ranks"),
          fetch("http://localhost:3001/quanKhu"),
          fetch("http://localhost:3001/suDoan"),
          fetch("http://localhost:3001/luDoan"),
          fetch("http://localhost:3001/tieuDoan"),
          fetch("http://localhost:3001/daiDoi"),
          fetch("http://localhost:3001/chucVu"),
        ]);
        if (!majorRes.ok || !classRes.ok || !rankRes.ok) {
          throw new Error("Không thể lấy dữ liệu");
        }
        const majorData = await majorRes.json();
        const classData = await classRes.json();
        const rankData = await rankRes.json();
        const qkData = await quanKhuRes.json();
        const sdData = await suDoanRes.json();
        const ldData = await luDoanRes.json();
        const tdData = tdRes.ok ? await tdRes.json() : [];
        const ddData = ddRes.ok ? await ddRes.json() : [];
        const cvData = cvRes.ok ? await cvRes.json() : [];
        setTieuDoan(Array.isArray(tdData) ? tdData : []);
        setDaiDoi(Array.isArray(ddData) ? ddData : []);
        setChucVuList(Array.isArray(cvData) ? cvData : []);
        setQuanKhu(qkData);
        setSubUnits([
          ...(sdData as NamedUnit[]).map((x) => ({
            id: x.id,
            name: x.nameSuDoan || "Chưa đặt tên",
            parentId: x.idQuanKhu,
            type: "Sư đoàn",
            source: "suDoan",
          })),
          ...(ldData as NamedUnit[]).map((x) => ({
            id: x.id,
            name: x.nameLuDoan || "Chưa đặt tên",
            parentId: x.idQuanKhu,
            type: "Lữ đoàn",
            source: "luDoan",
          })),
        ]);
        setMajors(majorData);
        setClasses(classData);
        setRanks(rankData);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setName(student.name);
    setSelectedMajor(String(student.majorId));
    setSelectedClass(String(student.classId));
    setSelectedDonVi(student.donVi);
    setSelectedChucVu(student.chucVu);
    setSelectedDanToc(student.danToc);
    setBirthDay(student.birthDay);
    setSelectedCapBac(student.capBac);
    setSelectedQuanKhu(student.quanKhuId || "");
    setSelectedSubUnit(student.donViCap2Id || "");
    setSelectedTieuDoan(student.tieuDoanId || "");
    setSelectedDaiDoi(student.daiDoiId || "");
    setExtra({ ...emptyStudentProfileExtra, ...student });
  }, [student]);

  const handleExtraChange = (name: keyof StudentProfileExtra, value: string) => {
    setExtra((prev) => ({ ...prev, [name]: value }));
  };

  const filteredClasses = classes.filter(
    (item) => String(item.majorId) === String(selectedMajor) && String(item.daiDoiId || "") === String(selectedDaiDoi),
  );
  const availableMajors = majors.filter((major) =>
    classes.some((item) => String(item.majorId) === String(major.id) && String(item.daiDoiId || "") === String(selectedDaiDoi)),
  );

  const handleMajorChange = (value: string) => {
    setSelectedMajor(value);
    setSelectedClass("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return alert("Vui lòng nhập tên học viên");
    if (!selectedMajor) return alert("Vui lòng chọn ngành");
    if (!selectedClass) return alert("Vui lòng chọn lớp");
    if (!selectedDonVi) return alert("Vui lòng chọn đơn vị");
    if (!selectedChucVu) return alert("Vui lòng chọn chức vụ");
    if (!selectedDanToc.trim()) return alert("Vui lòng nhập dân tộc");
    if (!birthDay) return alert("Vui lòng chọn ngày sinh");
    if (!selectedCapBac) return alert("Vui lòng chọn cấp bậc");
    if (!selectedQuanKhu) return alert("Vui lòng chọn quân khu");
    if (!selectedSubUnit) return alert("Vui lòng chọn sư đoàn/lữ đoàn");
    if (!selectedTieuDoan) return alert("Vui lòng chọn tiểu đoàn");
    if (!selectedDaiDoi) return alert("Vui lòng chọn đại đội");

    const updateStudent: Student = {
      id: student.id,
      maSoHV: student.maSoHV,
      name: name.trim(),
      majorId: selectedMajor,
      classId: selectedClass,
      donVi:
        daiDoi.find((x) => x.id === selectedDaiDoi)?.nameDaiDoi ||
        selectedDonVi,
      chucVu: selectedChucVu,
      danToc: selectedDanToc.trim(),
      birthDay: birthDay,
      capBac: selectedCapBac,
      quanKhuId: selectedQuanKhu,
      donViCap2Id: selectedSubUnit,
      tieuDoanId: selectedTieuDoan,
      daiDoiId: selectedDaiDoi,
      originQuanKhuId: student.originQuanKhuId || student.quanKhuId,
      originDonViCap2Id: student.originDonViCap2Id || student.donViCap2Id,
      ...extra,
    };

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateStudent),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      const data: Student = await res.json();
      onUpdate(data);
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Cập nhật học viên thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="student-form flex flex-col gap-6"
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">Các trường có liên kết đơn vị được sắp theo thứ tự từ quân khu đến đại đội để hạn chế chọn sai dữ liệu.</div>

      {/* MÃ SỐ HỌC VIÊN */}
      <div className="mb-4">
        <label className="field-label">Mã số học viên</label>
        <input
          type="text"
          value={student.maSoHV}
          disabled
          className="field-control bg-slate-100 text-slate-500"
        />
      </div>

      {/* TÊN HỌC VIÊN */}
      <div className="mb-4">
        <label className="field-label">Tên học viên</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-control"
          placeholder="Nhập tên học viên"
        />
      </div>

      {/* NGÀNH ĐÀO TẠO — shown after Đại đội via flex order */}
      <div className="order-20 mb-4">
        <label className="field-label">Ngành đào tạo</label>
        <select
          value={selectedMajor}
          onChange={(e) => handleMajorChange(e.target.value)}
          disabled={!selectedDaiDoi}
          className="field-control disabled:bg-slate-100"
        >
          <option value="">{selectedDaiDoi ? "-- Chọn ngành --" : "-- Chọn Đại đội trước --"}</option>
          {availableMajors.map((major) => (
            <option key={major.id} value={String(major.id)}>
              {major.name}
            </option>
          ))}
        </select>
      </div>

      {/* LỚP HỌC */}
      <div className="order-21 mb-4">
        <label className="field-label">Chọn lớp học</label>
        <select
          disabled={!selectedMajor || !selectedDaiDoi}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="field-control"
        >
          {!selectedMajor ? (
            <option value="">-- Chưa chọn ngành --</option>
          ) : !selectedDaiDoi ? (
            <option value="">-- Chọn Đại đội trước --</option>
          ) : (
            <option value="">-- Chọn lớp học --</option>
          )}

          {filteredClasses.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* QUÂN KHU VÀ ĐƠN VỊ CẤP 2 */}
      <div className="order-30 mb-4">
        <label className="field-label">Quân khu</label>
        <select
          value={selectedQuanKhu}
          onChange={(e) => {
            setSelectedQuanKhu(e.target.value);
            setSelectedSubUnit("");
          }}
          className="field-control"
        >
          <option value="">-- Chọn quân khu --</option>
          {quanKhu.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nameQuanKhu}
            </option>
          ))}
        </select>
      </div>
      <div className="order-31 mb-4">
        <label className="field-label">Sư đoàn/Lữ đoàn</label>
        <select
          value={selectedSubUnit}
          onChange={(e) => setSelectedSubUnit(e.target.value)}
          disabled={!selectedQuanKhu}
          className="field-control disabled:bg-slate-100"
        >
          <option value="">
            {selectedQuanKhu
              ? "-- Chọn đơn vị --"
              : "-- Chọn quân khu trước --"}
          </option>
          {subUnits
            .filter((x) => x.parentId === selectedQuanKhu)
            .map((item) => (
              <option
                key={`${item.source}:${item.id}`}
                value={`${item.source}:${item.id}`}
              >
                {item.type} {item.name}
              </option>
            ))}
        </select>
      </div>

      {/* TIỂU ĐOÀN / ĐẠI ĐỘI */}
      <div className="order-32 mb-4">
        <label className="field-label">Tiểu đoàn</label>
        <select
          value={selectedTieuDoan}
          onChange={(e) => {
            setSelectedTieuDoan(e.target.value);
            setSelectedDaiDoi("");
          }}
          className="field-control"
        >
          <option value="">-- Chọn Tiểu đoàn --</option>
          {tieuDoan.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nameTieuDoan}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="field-label">Đại đội quản lý lớp</label>
        <select
          value={selectedDaiDoi}
          onChange={(e) => { setSelectedDaiDoi(e.target.value); setSelectedMajor(""); setSelectedClass(""); }}
          disabled={!selectedTieuDoan}
          className="field-control disabled:bg-slate-100"
        >
          <option value="">
            {selectedTieuDoan
              ? "-- Chọn Đại đội --"
              : "-- Chọn Tiểu đoàn trước --"}
          </option>
          {daiDoi
            .filter((x) => String(x.idTieuDoan) === String(selectedTieuDoan))
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.nameDaiDoi}
              </option>
            ))}
        </select>
      </div>

      {/* CHỨC VỤ */}
      <div className="mb-4">
        <label className="field-label">Chức vụ</label>
        <select
          value={selectedChucVu}
          onChange={(e) => setSelectedChucVu(e.target.value)}
          className="field-control"
        >
          <option value="">-- Chọn chức vụ --</option>
          {chucVuList.map((x) => (
            <option key={x.id} value={x.name}>
              {x.name}
            </option>
          ))}
        </select>
      </div>

      {/* DÂN TỘC */}
      <div className="mb-4">
        <label className="field-label">Dân tộc</label>
        <input
          type="text"
          value={selectedDanToc}
          onChange={(e) => setSelectedDanToc(e.target.value)}
          className="field-control"
          placeholder="Nhập dân tộc"
        />
      </div>

      {/* NGÀY SINH */}
      <div className="mb-4">
        <label className="field-label">Ngày sinh</label>
        <input
          type="date"
          value={birthDay}
          onChange={(e) => setBirthDay(e.target.value)}
          className="field-control"
        />
      </div>

      {/* CẤP BẬC */}
      <div className="mb-6">
        <label className="field-label">Cấp bậc</label>
        <select
          value={selectedCapBac}
          onChange={(e) => setSelectedCapBac(e.target.value)}
          className="field-control"
        >
          <option value="">-- Chọn cấp bậc --</option>
          {[...ranks]
            .sort((a, b) => a.rankOrder - b.rankOrder)
            .map((rank) => (
              <option key={rank.id} value={rank.name}>
                {rank.name}
              </option>
            ))}
        </select>
      </div>

      <StudentProfileExtraFields value={extra} onChange={handleExtraChange} />
      {/* BUTTON */}
      <div className="sticky bottom-0 -mx-1 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-1 pt-5 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
