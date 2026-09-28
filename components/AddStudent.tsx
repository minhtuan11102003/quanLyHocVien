"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Major = {
  majorId: string;
  name: string;
  shortName: string;
};

type ClassItem = {
  id: string;
  majorId: number | string;
  name: string;
};

type QuanKhu = {
  id: string;
  nameQuanKhu: string;
  code: string;
  description: string;
};

type FormData = {
  maSoHV: string;
  name: string;
  majorId: string;
  classId: string;
  donVi: string;
  chucVu: string;
  danToc: string;
  birthDay: string;
  capBac: string;
  quanKhuId: string;
};

type Rank = { id: string; name: string; rankOrder: number };

type AddStudentProps = {
  onClose: () => void;
};

export default function AddStudentComponent({ onClose }: AddStudentProps) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [quanKhu, setQuankhu] = useState<QuanKhu[]>([]);

  const [form, setForm] = useState<FormData>({
    maSoHV: "",
    name: "",
    majorId: "",
    classId: "",
    donVi: "",
    chucVu: "",
    danToc: "",
    birthDay: "",
    capBac: "",
    quanKhuId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [majorRes, classRes, rankRes, quanKhuRes] = await Promise.all([
          fetch("http://localhost:3001/majors"),
          fetch("http://localhost:3001/classes"),
          fetch("http://localhost:3001/ranks"),
          fetch("http://localhost:3001/quanKhu"),
        ]);

        if (!majorRes.ok || !classRes.ok || !rankRes.ok) {
          throw new Error("Không thể lấy dữ liệu");
        }

        const majorData = await majorRes.json();
        const classData = await classRes.json();
        const rankData = await rankRes.json();
        const quanKhuData = await quanKhuRes.json();
        setQuankhu(quanKhuData);

        setMajors(majorData);
        setClasses(classData);
        setRanks(rankData);
      } catch (error) {
        console.error("Lỗi:", error);
      }
    };

    fetchData();
  }, []);

  // Lọc lớp theo ngành
  const filteredClasses = classes.filter(
    (item) => Number(item.majorId) == Number(form.majorId),
  );

  // Xử lý input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Khi đổi ngành
  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const majorId = e.target.value;

    setForm((prev) => ({
      ...prev,
      majorId,
      classId: "",
    }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !form.maSoHV ||
      !form.name ||
      !form.majorId ||
      !form.classId ||
      !form.donVi ||
      !form.chucVu ||
      !form.danToc ||
      !form.birthDay ||
      !form.capBac
    ) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const newStudent = {
        id: crypto.randomUUID(),

        maSoHV: form.maSoHV.trim(),

        name: form.name.trim(),

        majorId: form.majorId,

        classId: form.classId,

        donVi: form.donVi,
        chucVu: form.chucVu,
        danToc: form.danToc,
        birthDay: form.birthDay,
        capBac: form.capBac,
      };

      const res = await fetch("http://localhost:3001/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStudent),
      });

      if (!res.ok) {
        throw new Error("Thêm học viên thất bại");
      }

      alert("Thêm học viên thành công");

      onClose();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi xảy ra khi thêm học viên");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="h-[800px] overflow-y-auto pr-2 space-y-5"
    >
      <h2 className="text-2xl font-bold">Thêm học viên</h2>
      {/* Mã số học viên */}
      <div>
        <label className="mb-2 block font-semibold">Mã số học viên</label>

        <input
          type="text"
          name="maSoHV"
          value={form.maSoHV}
          onChange={handleChange}
          placeholder="Nhập mã số học viên"
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>
      {/* Tên học viên */}
      <div>
        <label className="mb-2 block font-semibold">Tên học viên</label>

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nhập tên học viên"
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>
      {/* Ngành đào tạo */}
      <div>
        <label className="mb-2 block font-semibold">Ngành đào tạo</label>

        <select
          name="majorId"
          value={form.majorId}
          onChange={handleMajorChange}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Chọn ngành đào tạo --</option>

          {majors.map((major) => (
            <option value={major.majorId}>{major.name}</option>
          ))}
        </select>
      </div>

      {/* Lớp học */}
      <div>
        <label className="mb-2 block font-semibold">Lớp học</label>

        <select
          name="classId"
          value={form.classId}
          onChange={handleChange}
          disabled={!form.majorId}
          className="w-full rounded-lg border px-4 py-3 outline-none disabled:bg-gray-100 focus:border-blue-500"
        >
          <option value="">
            {!form.majorId
              ? "-- Vui lòng chọn ngành trước --"
              : "-- Chọn lớp học --"}
          </option>

          {filteredClasses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-semibold">Chọn Quân Khu</label>

        <select
          name="quanKhuId"
          value={form.quanKhuId}
          // onChange={handleMajorChange}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Chọn quân khu --</option>

          {quanKhu.map((item) => (
            <option value={item.id}>{item.nameQuanKhu}</option>
          ))}
        </select>
      </div>
      {/* Đơn vị */}
      <div>
        <label className="mb-2 block font-semibold">Đơn vị</label>

        <select
          name="donVi"
          value={form.donVi}
          onChange={handleChange}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Chọn đơn vị --</option>

          <option value="Đại đội 1">Đại đội 1</option>

          <option value="Đại đội 2">Đại đội 2</option>

          <option value="Đại đội 3">Đại đội 3</option>

          <option value="Đại đội 4">Đại đội 4</option>

          <option value="Đại đội 5">Đại đội 5</option>
        </select>
      </div>
      {/* Chức vụ */}
      <div>
        <label className="mb-2 block font-semibold">Chức vụ</label>

        <select
          name="chucVu"
          value={form.chucVu}
          onChange={handleChange}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">-- Chọn chức vụ --</option>

          <option value="Học viên">Học viên</option>

          <option value="Lớp trưởng">Lớp trưởng</option>

          <option value="Lớp phó học tập">Lớp phó học tập</option>

          <option value="Lớp phó">Lớp phó</option>
        </select>
      </div>

      {/* Dân tộc */}
      <div>
        <label className="mb-2 block font-semibold">Dân tộc</label>

        <input
          type="text"
          name="danToc"
          value={form.danToc}
          onChange={handleChange}
          placeholder="Nhập dân tộc"
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>
      {/* Ngày sinh */}
      <div>
        <label className="mb-2 block font-semibold">Ngày sinh</label>

        <input
          type="date"
          name="birthDay"
          value={form.birthDay}
          onChange={handleChange}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>
      {/* Cấp bậc */}

      <div>
        <label className="mb-2 block font-semibold">Cấp bậc</label>

        <select
          name="capBac"
          value={form.capBac}
          onChange={handleChange}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
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
      {/* Button */}
      <div className="flex justify-end gap-3 pt-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy
        </Button>

        <Button
          type="submit"
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Thêm học viên
        </Button>
      </div>
    </form>
  );
}
