"use client";

import { useEffect, useState } from "react";

type AddClassProps = {
  onClose: () => void | Promise<void>;
};

type Major = {
  id: string;
  name: string;
  shortName: string;
};

export default function AddClassComponent({ onClose }: AddClassProps) {
  const [name, setName] = useState("");
  const [majorId, setMajorId] = useState("");
  const [daiDoiId, setDaiDoiId] = useState("");
  const [daiDoi, setDaiDoi] = useState<{id:string;nameDaiDoi:string}[]>([]);

  const [majors, setMajors] = useState<Major[]>([]);

  // Lấy danh sách ngành
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await fetch("http://localhost:3001/majors");

        if (!res.ok) {
          throw new Error("Không thể lấy danh sách ngành");
        }

        const data = await res.json();

        setMajors(data);
        const unitRes = await fetch("http://localhost:3001/daiDoi");
        if (unitRes.ok) setDaiDoi(await unitRes.json());
      } catch (error) {
        console.error("Lỗi:", error);
      }
    };

    fetchMajors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // =========================
    // VALIDATE
    // =========================

    if (!name.trim()) {
      alert("Vui lòng nhập tên lớp");
      return;
    }

    if (!majorId) { alert("Vui lòng chọn ngành đào tạo"); return; }
    if (!daiDoiId) { alert("Vui lòng chọn đại đội quản lý"); return; }

    try {
      const classRes = await fetch("http://localhost:3001/classes");

      if (!classRes.ok) {
        throw new Error("Không thể lấy danh sách lớp");
      }

      // =========================
      // TẠO CLASS MỚI`
      // =========================

      const newClass = { majorId, name: name.trim(), daiDoiId };

      const res = await fetch("http://localhost:3001/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      if (!res.ok) {
        throw new Error("Thêm lớp thất bại");
      }

      alert("Thêm lớp thành công");

      await onClose();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi xảy ra khi thêm lớp");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5">
      <h2 className="text-2xl font-bold">Thêm lớp học</h2>

      {/* =========================
          NGÀNH ĐÀO TẠO
      ========================= */}

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
              {major.name}{major.shortName ? ` (${major.shortName})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div><label className="mb-2 block font-medium">Đại đội quản lý</label><select value={daiDoiId} onChange={(e)=>setDaiDoiId(e.target.value)} className="w-full rounded-lg border px-4 py-3"><option value="">-- Chọn đại đội --</option>{daiDoi.map(x=><option key={x.id} value={x.id}>{x.nameDaiDoi}</option>)}</select></div>

      {/* =========================
          TÊN LỚP
      ========================= */}

      <div>
        <label className="mb-2 block font-medium">Tên lớp</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên lớp"
          className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* =========================
          BUTTON
      ========================= */}

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-500 py-3 font-bold text-white hover:bg-blue-600"
      >
        Thêm lớp
      </button>
    </form>
  );
}
