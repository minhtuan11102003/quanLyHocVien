/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

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
};

type Major = { id: number | string; name: string; shortName: string };

type ClassItem = {
  id: number | string;
  majorId: number | string;
  name: string;
};

type EditStudentProps = {
  student: Student;
  onClose: () => void;
  onUpdate: (student: Student) => void;
};

const donViList = [
  { id: 1, donVi: "Đại đội 1" },
  { id: 2, donVi: "Đại đội 2" },
  { id: 3, donVi: "Đại đội 3" },
  { id: 4, donVi: "Đại đội 4" },
  { id: 5, donVi: "Đại đội 5" },
];

const chucVuList = [
  { id: 1, chucVu: "Lớp trưởng" },
  { id: 2, chucVu: "Lớp phó hậu cần" },
  { id: 3, chucVu: "Lớp phó học tập" },
  { id: 4, chucVu: "Học viên" },
];

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
          ...sdData.map((x: any) => ({
            id: x.id,
            name: x.nameSuDoan,
            parentId: x.idQuanKhu,
            type: "Sư đoàn",
            source: "suDoan",
          })),
          ...ldData.map((x: any) => ({
            id: x.id,
            name: x.nameLuDoan,
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
  }, [student]);

  const filteredClasses = classes.filter(
    (item) => String(item.majorId) === String(selectedMajor),
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
      className="h-[800px] overflow-y-auto pr-2 space-y-5"
    >
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800">Sửa học viên</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cập nhật thông tin học viên
        </p>
      </div>

      {/* MÃ SỐ HỌC VIÊN */}
      <div className="mb-4">
        <label className="mb-2 block font-medium">Mã số học viên</label>
        <input
          type="text"
          value={student.maSoHV}
          disabled
          className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 outline-none"
        />
      </div>

      {/* TÊN HỌC VIÊN */}
      <div className="mb-4">
        <label className="mb-2 block font-medium">Tên học viên</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Nhập tên học viên"
        />
      </div>

      {/* NGÀNH ĐÀO TẠO */}
      <div className="mb-4">
        <label className="mb-2 block font-medium">Ngành đào tạo</label>
        <select
          value={selectedMajor}
          onChange={(e) => handleMajorChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Chọn ngành --</option>
          {majors.map((major) => (
            <option key={major.id} value={String(major.id)}>
              {major.name}
            </option>
          ))}
        </select>
      </div>

      {/* LỚP HỌC */}
      <div className="mb-4">
        <label className="mb-2 block font-medium">Chọn lớp học</label>
        <select
          disabled={!selectedMajor}
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        >
          {!selectedMajor ? (
            <option value="">-- Chưa chọn ngành --</option>
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
      <div className="mb-4">
        <label className="mb-2 block font-medium">Quân khu</label>
        <select
          value={selectedQuanKhu}
          onChange={(e) => {
            setSelectedQuanKhu(e.target.value);
            setSelectedSubUnit("");
          }}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Chọn quân khu --</option>
          {quanKhu.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nameQuanKhu}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="mb-2 block font-medium">Sư đoàn/Lữ đoàn</label>
        <select
          value={selectedSubUnit}
          onChange={(e) => setSelectedSubUnit(e.target.value)}
          disabled={!selectedQuanKhu}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none disabled:bg-gray-100 focus:border-blue-500"
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
      <div className="mb-4">
        <label className="mb-2 block font-medium">Tiểu đoàn</label>
        <select
          value={selectedTieuDoan}
          onChange={(e) => {
            setSelectedTieuDoan(e.target.value);
            setSelectedDaiDoi("");
          }}
          className="w-full rounded-lg border border-gray-300 px-4 py-3"
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
        <label className="mb-2 block font-medium">Đại đội quản lý lớp</label>
        <select
          value={selectedDaiDoi}
          onChange={(e) => setSelectedDaiDoi(e.target.value)}
          disabled={!selectedTieuDoan}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 disabled:bg-gray-100"
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
        <label className="mb-2 block font-medium">Chức vụ</label>
        <select
          value={selectedChucVu}
          onChange={(e) => setSelectedChucVu(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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
        <label className="mb-2 block font-medium">Dân tộc</label>
        <input
          type="text"
          value={selectedDanToc}
          onChange={(e) => setSelectedDanToc(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Nhập dân tộc"
        />
      </div>

      {/* NGÀY SINH */}
      <div className="mb-4">
        <label className="mb-2 block font-medium">Ngày sinh</label>
        <input
          type="date"
          value={birthDay}
          onChange={(e) => setBirthDay(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* CẤP BẬC */}
      <div className="mb-6">
        <label className="mb-2 block font-medium">Cấp bậc</label>
        <select
          value={selectedCapBac}
          onChange={(e) => setSelectedCapBac(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
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

      {/* BUTTON */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-lg bg-gray-300 px-5 py-3 font-medium hover:bg-gray-400 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
