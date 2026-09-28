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
};

type Major = { majorId: number | string; name: string; shortName: string };

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [majorRes, classRes, rankRes] = await Promise.all([
          fetch("http://localhost:3001/majors"),
          fetch("http://localhost:3001/classes"),
          fetch("http://localhost:3001/ranks"),
        ]);
        if (!majorRes.ok || !classRes.ok || !rankRes.ok) {
          throw new Error("Không thể lấy dữ liệu");
        }
        const majorData = await majorRes.json();
        const classData = await classRes.json();
        const rankData = await rankRes.json();
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
  }, [student]);

  const filteredClasses = classes.filter(
    (item) => item.majorId === selectedMajor,
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

    const updateStudent: Student = {
      id: student.id,
      maSoHV: student.maSoHV,
      name: name.trim(),
      majorId: selectedMajor,
      classId: selectedClass,
      donVi: selectedDonVi,
      chucVu: selectedChucVu,
      danToc: selectedDanToc.trim(),
      birthDay: birthDay,
      capBac: selectedCapBac,
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
    <form onSubmit={handleSubmit}>
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
            <option key={major.majorId} value={String(major.majorId)}>
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

      {/* ĐƠN VỊ */}
      <div className="mb-4">
        <label className="mb-2 block font-medium">Đơn vị</label>
        <select
          value={selectedDonVi}
          onChange={(e) => setSelectedDonVi(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Chọn đơn vị --</option>
          {donViList.map((item) => (
            <option key={item.id} value={item.donVi}>
              {item.donVi}
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
          {chucVuList.map((item) => (
            <option key={item.id} value={item.chucVu}>
              {item.chucVu}
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
