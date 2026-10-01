"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Student = {
  id: string;
  maSoHV: string;
  name: string;
  majorId: string;
  classId: string;
  donVi: string;
  chucVu: string;
  danToc: string;
  birthDay: string;
  capBac: string;
};

type Major = {
  id: string;
  name: string;
  shortName: string;
};

type Rank = { id: string; name: string; rankOrder: number };

type ClassItem = {
  id: string;
  majorId: string;
  name: string;
};

type EditManyStudentProps = {
  selectedIds: string[];
  students: Student[];
  onClose: () => void;
  onUpdate: () => void;
};

const donViList = [
  {
    id: 1,
    name: "Đại đội 1",
  },
  {
    id: 2,
    name: "Đại đội 2",
  },
  {
    id: 3,
    name: "Đại đội 3",
  },
  {
    id: 4,
    name: "Đại đội 4",
  },
  {
    id: 5,
    name: "Đại đội 5",
  },
];

const chucVuList = [
  {
    id: 1,
    name: "Lớp trưởng",
  },
  {
    id: 2,
    name: "Lớp phó hậu cần",
  },
  {
    id: 3,
    name: "Lớp phó học tập",
  },
  {
    id: 4,
    name: "Học viên",
  },
];

export default function EditManyStudent({
  selectedIds,
  students,
  onClose,
  onUpdate,
}: EditManyStudentProps) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);

  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDonVi, setSelectedDonVi] = useState<string>("");
  const [selectedChucVu, setSelectedChucVu] = useState<string>("");
  const [selectedCapBac, setSelectedCapBac] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // LẤY NGÀNH + LỚP
  // ==========================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [majorRes, classRes, rankRes] = await Promise.all([
          fetch("http://localhost:3001/majors"),
          fetch("http://localhost:3001/classes"),
          fetch("http://localhost:3001/ranks"),
        ]);

        if (!majorRes.ok || !classRes.ok || !rankRes.ok) {
          throw new Error("Không thể lấy dữ liệu ngành/lớp");
        }

        const majorData = await majorRes.json();
        const classData = await classRes.json();
        const rankData = await rankRes.json();

        setMajors(majorData);
        setClasses(classData);
        setRanks(rankData);
      } catch (error) {
        console.error(error);
        alert("Không thể tải dữ liệu ngành/lớp");
      }
    };

    fetchData();
  }, []);

  // ==========================================
  // LẤY NHỮNG HỌC VIÊN ĐANG ĐƯỢC CHỌN
  // ==========================================

  const selectedStudents = students.filter((student) =>
    selectedIds.includes(student.id),
  );

  // ==========================================
  // LỌC LỚP THEO NGÀNH
  // ==========================================

  const filteredClasses = classes.filter(
    (item) => String(item.majorId) === String(selectedMajor),
  );

  // ==========================================
  // CHỌN NGÀNH
  // ==========================================

  const handleMajorChange = (value: string | null) => {
    value ??= "";
    setSelectedMajor(value);

    // Khi đổi ngành thì phải reset lớp
    setSelectedClass("");
  };

  // ==========================================
  // LƯU THAY ĐỔI
  // ==========================================

  const handleUpdate = async () => {
    if (
      !selectedMajor &&
      !selectedClass &&
      !selectedDonVi &&
      !selectedChucVu &&
      !selectedCapBac
    ) {
      alert("Bạn chưa chọn thông tin muốn thay đổi!");
      return;
    }

    if (selectedStudents.length === 0) {
      alert("Không có học viên nào được chọn!");
      return;
    }

    try {
      setLoading(true);

      await Promise.all(
        selectedStudents.map(async (student) => {
          const updates: Partial<Student> = {};
          if (selectedMajor) updates.majorId = selectedMajor;
          if (selectedClass) updates.classId = selectedClass;
          if (selectedDonVi) updates.donVi = selectedDonVi;
          if (selectedChucVu) updates.chucVu = selectedChucVu;
          if (selectedCapBac) updates.capBac = selectedCapBac;

          const res = await fetch(
            `http://localhost:3001/students/${student.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updates),
            },
          );

          if (!res.ok) {
            throw new Error(`Không thể cập nhật học viên ${student.maSoHV}`);
          }
        }),
      );

      alert(`Đã cập nhật ${selectedStudents.length} học viên thành công!`);

      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi cập nhật!");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="space-y-6">
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">Các trường để trống sẽ được giữ nguyên. Thay đổi sẽ áp dụng cho <strong>{selectedStudents.length}</strong> học viên đã chọn.</div>

        {/* ========================= */}
        {/* DANH SÁCH HỌC VIÊN */}
        {/* ========================= */}

        <div className="rounded-2xl border border-slate-200">
          <div className="border-b border-slate-100 bg-slate-50 p-4 font-semibold text-slate-800">
            Học viên được chọn
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            {selectedStudents.map((student) => {
              const major = majors.find(
                (item) => String(item.id) === String(student.majorId),
              );

              const classItem = classes.find(
                (item) =>
                  String(item.id) === String(student.classId) &&
                  String(item.majorId) === String(student.majorId),
              );

              return (
                <div key={student.id} className="border-b border-slate-100 p-3 last:border-b-0">
                  <div className="font-semibold text-slate-900">{student.name}</div>

                  <div className="mt-1 text-sm text-gray-500">
                    Mã số: {student.maSoHV}
                  </div>

                  <div className="mt-1 text-sm">
                    Ngành: {major ? `${major.name}${major.shortName ? ` (${major.shortName})` : ""}` : "Chưa xác định"}
                  </div>

                  <div className="text-sm">
                    Lớp: {classItem?.name || "Chưa xác định"}
                  </div>

                  <div className="text-sm">Đơn vị: {student.donVi}</div>

                  <div className="text-sm">Chức vụ: {student.chucVu}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================= */}
        {/* NGÀNH */}
        {/* ========================= */}

        <div className="mb-4">
          <label className="mb-2 block font-medium">Ngành đào tạo</label>

          <Select value={selectedMajor} onValueChange={handleMajorChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn ngành muốn chuyển" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Ngành đào tạo</SelectLabel>

                {majors.map((major) => (
                  <SelectItem key={String(major.id)} value={String(major.id)}>
                    {major.name}{major.shortName ? ` (${major.shortName})` : ""}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <p className="mt-1 text-xs text-gray-500">
            Không chọn nếu không muốn thay đổi ngành.
          </p>
        </div>

        {/* ========================= */}
        {/* LỚP */}
        {/* ========================= */}

        <div className="mb-4">
          <label className="mb-2 block font-medium">Lớp</label>

          <Select
            value={selectedClass}
            onValueChange={(value) => setSelectedClass(value ?? "")}
            disabled={!selectedMajor}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  selectedMajor
                    ? "Chọn lớp muốn chuyển"
                    : "Hãy chọn ngành trước"
                }
              />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Lớp thuộc ngành</SelectLabel>

                {filteredClasses.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <p className="mt-1 text-xs text-gray-500">
            Lớp sẽ tự động lọc theo ngành đã chọn.
          </p>
        </div>

        {/* ========================= */}
        <div className="mb-4">
          <label className="mb-2 block font-medium">Cấp bậc</label>
          <Select
            value={selectedCapBac}
            onValueChange={(value) => setSelectedCapBac(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn cấp bậc muốn thay đổi" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cấp bậc</SelectLabel>
                {[...ranks]
                  .sort((a, b) => a.rankOrder - b.rankOrder)
                  .map((rank) => (
                    <SelectItem key={rank.id} value={rank.name}>
                      {rank.name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-gray-500">
            Không chọn nếu không muốn thay đổi cấp bậc.
          </p>
        </div>

        {/* ĐƠN VỊ */}
        {/* ========================= */}

        <div className="mb-4">
          <label className="mb-2 block font-medium">Đơn vị</label>

          <Select
            value={selectedDonVi}
            onValueChange={(value) => setSelectedDonVi(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn đơn vị muốn thay đổi" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Đơn vị</SelectLabel>

                {donViList.map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* ========================= */}
        {/* CHỨC VỤ */}
        {/* ========================= */}

        <div className="mb-6">
          <label className="mb-2 block font-medium">Chức vụ</label>

          <Select
            value={selectedChucVu}
            onValueChange={(value) => setSelectedChucVu(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn chức vụ muốn thay đổi" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Chức vụ</SelectLabel>

                {chucVuList.map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* ========================= */}
        {/* BUTTON */}
        {/* ========================= */}

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white/95 pt-5 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang cập nhật..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
  );
}
