"use client";

import { useEffect, useState } from "react";

type ClassItem = {
  id: string;
  majorId: string;
  name: string;
};

type Major = {
  id: string;
  name: string;
  shortName: string;
};

type EditClassProps = {
  classItem: ClassItem;
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
};

export default function EditClassComponent({
  classItem,
  onClose,
  onUpdate,
}: EditClassProps) {
  const [name, setName] = useState(classItem.name);

  const [majorId, setMajorId] = useState(String(classItem.majorId));

  const [majors, setMajors] = useState<Major[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/majors")
      .then((res) => res.json())
      .then((data) => setMajors(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Vui lòng nhập tên lớp");
      return;
    }

    if (!majorId) {
      alert("Vui lòng chọn ngành");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/classes/${classItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: classItem.id,
          majorId: majorId,
          name: name.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Cập nhật thất bại");
      }

      alert("Cập nhật thành công");

      await onUpdate();

      onClose();
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5">
      <h2 className="text-2xl font-bold">Sửa lớp học</h2>

      {/* NGÀNH */}

      <div>
        <label className="mb-2 block font-medium">Ngành đào tạo</label>

        <select
          value={majorId}
          onChange={(e) => setMajorId(e.target.value)}
          className="w-full rounded-lg border px-4 py-3"
        >
          <option value="">-- Chọn ngành --</option>

          {majors.map((major) => (
            <option key={major.id} value={major.id}>
              {major.name}
            </option>
          ))}
        </select>
      </div>

      {/* TÊN LỚP */}

      <div>
        <label className="mb-2 block font-medium">Tên lớp</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* BUTTON */}

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-500 py-3 font-bold text-white hover:bg-blue-600"
      >
        Lưu thay đổi
      </button>
    </form>
  );
}
