"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import StudentProfileExtraFields from "@/components/StudentProfileExtraFields";
import {
  emptyStudentProfileExtra,
  type StudentProfileExtra,
} from "@/app/types/student";

type Major = {
  id: string;
  name: string;
  shortName: string;
};

type ClassItem = {
  id: string;
  majorId: number | string;
  name: string;
  daiDoiId?: string;
};

type QuanKhu = {
  id: string;
  nameQuanKhu: string;
  code: string;
  description: string;
};

type FormData = StudentProfileExtra & {
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
  donViCap2Id: string;
  tieuDoanId: string;
  daiDoiId: string;
};

type Rank = { id: string; name: string; rankOrder: number };
type Company = { id: string; idTieuDoan: string; nameDaiDoi: string };
type NamedUnit = { id: string; idQuanKhu: string; nameSuDoan?: string; nameLuDoan?: string };

type AddStudentProps = {
  onClose: () => void;
};

export default function AddStudentComponent({ onClose }: AddStudentProps) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [quanKhu, setQuankhu] = useState<QuanKhu[]>([]);
  const [subUnits, setSubUnits] = useState<
    {
      id: string;
      name: string;
      parentId: string;
      type: string;
      source: string;
    }[]
  >([]);
  const [tieuDoan, setTieuDoan] = useState<
    { id: string; nameTieuDoan: string }[]
  >([]);
  const [daiDoi, setDaiDoi] = useState<
    { id: string; nameDaiDoi: string; idTieuDoan: string }[]
  >([]);
  const [chucVuList, setChucVuList] = useState<{ id: string; name: string }[]>(
    [],
  );

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
    donViCap2Id: "",
    tieuDoanId: "",
    daiDoiId: "",
    ...emptyStudentProfileExtra,
  });

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
        const quanKhuData = await quanKhuRes.json();
        const suDoanData = await suDoanRes.json();
        const luDoanData = await luDoanRes.json();
        let tdData = tdRes.ok ? await tdRes.json() : [];
        const ddData = ddRes.ok ? await ddRes.json() : [];
        const cvData = cvRes.ok ? await cvRes.json() : [];
        if (!Array.isArray(tdData) || !tdData.length) {
          const ids = [
            ...new Set(
              (Array.isArray(ddData) ? ddData as Company[] : []).map((x) =>
                String(x.idTieuDoan),
              ),
            ),
          ];
          tdData = ids.map((id, index) => ({
            id,
            nameTieuDoan: `Tiểu đoàn ${index + 1}`,
          }));
        }
        setTieuDoan(Array.isArray(tdData) ? tdData : []);
        setDaiDoi(Array.isArray(ddData) ? ddData : []);
        setChucVuList(
          Array.isArray(cvData) && cvData.length
            ? cvData
            : [
                { id: "default_hoc_vien", name: "Học viên" },
                { id: "default_lop_truong", name: "Lớp trưởng" },
              ],
        );
        setQuankhu(quanKhuData);
        setSubUnits([
          ...(suDoanData as NamedUnit[]).map((x) => ({
            id: x.id,
            name: x.nameSuDoan || "Chưa đặt tên",
            parentId: x.idQuanKhu,
            type: "Sư đoàn",
            source: "suDoan",
          })),
          ...(luDoanData as NamedUnit[]).map((x) => ({
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
        console.error("Lỗi:", error);
      }
    };

    fetchData();
  }, []);

  // Lọc lớp theo ngành
  const filteredClasses = classes.filter(
    (item) => String(item.majorId) === String(form.majorId) && String(item.daiDoiId || "") === String(form.daiDoiId),
  );
  const availableMajors = majors.filter((major) =>
    classes.some((item) => String(item.majorId) === String(major.id) && String(item.daiDoiId || "") === String(form.daiDoiId)),
  );

  const filteredSubUnits = subUnits.filter(
    (item) => item.parentId === form.quanKhuId,
  );
  const filteredDaiDoi = daiDoi.filter(
    (item) => String(item.idTieuDoan) === String(form.tieuDoanId),
  );

  const isSelectedClassValid =
    !form.majorId || !form.classId
      ? true
      : classes.some(
          (item) =>
            String(item.id) === String(form.classId) &&
            String(item.majorId) === String(form.majorId) &&
            String(item.daiDoiId || "") === String(form.daiDoiId),
        );

  const isSelectedSubUnitValid =
    !form.quanKhuId || !form.donViCap2Id
      ? true
      : subUnits.some(
          (item) =>
            (`${item.source}:${item.id}` === form.donViCap2Id ||
              String(item.id) === String(form.donViCap2Id)) &&
            String(item.parentId) === String(form.quanKhuId),
        );

  const handleExtraChange = (
    name: keyof StudentProfileExtra,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
      !form.chucVu ||
      !form.danToc ||
      !form.birthDay ||
      !form.capBac ||
      !form.quanKhuId ||
      !form.donViCap2Id ||
      !form.tieuDoanId ||
      !form.daiDoiId
    ) {
      alert(
        "Vui lòng nhập đầy đủ thông tin và chọn đầy đủ các mốc liên kết (ngành, lớp, quân khu, đơn vị, tiểu đoàn, đại đội)",
      );
      return;
    }

    if (!isSelectedClassValid) {
      alert(
        "Lớp học không thuộc ngành đào tạo đã chọn. Vui lòng chọn lại lớp phù hợp.",
      );
      return;
    }

    if (!isSelectedSubUnitValid) {
      alert(
        "Đơn vị cấp 2 không thuộc quân khu đã chọn. Vui lòng chọn lại đơn vị phù hợp.",
      );
      return;
    }

    const selectedDaiDoi = daiDoi.find(
      (item) => String(item.id) === String(form.daiDoiId),
    );

    if (!selectedDaiDoi) {
      alert("Đại đội không hợp lệ. Vui lòng chọn lại đại đội.");
      return;
    }

    if (String(selectedDaiDoi.idTieuDoan) !== String(form.tieuDoanId)) {
      alert(
        "Đại đội không thuộc tiểu đoàn đã chọn. Vui lòng chọn đúng liên kết.",
      );
      return;
    }

    try {
      const newStudent = {
        id: crypto.randomUUID(),

        maSoHV: form.maSoHV.trim(),

        name: form.name.trim(),

        majorId: form.majorId,

        classId: form.classId,

        donVi: selectedDaiDoi.nameDaiDoi,
        chucVu: form.chucVu,
        danToc: form.danToc,
        birthDay: form.birthDay,
        capBac: form.capBac,
        quanKhuId: form.quanKhuId,
        donViCap2Id: form.donViCap2Id,
        tieuDoanId: form.tieuDoanId,
        daiDoiId: form.daiDoiId,
        originQuanKhuId: form.quanKhuId,
        originDonViCap2Id: form.donViCap2Id,
      };

      const res = await fetch("http://localhost:3001/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStudent),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Thêm học viên thất bại");
      }

      alert("Thêm học viên thành công");

      onClose();
    } catch (error) {
      console.error("Lỗi:", error);
      alert(
        "Có lỗi xảy ra khi thêm học viên. Vui lòng kiểm tra đầy đủ liên kết dữ liệu.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="student-form flex flex-col gap-6"
    >
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">Hoàn thành theo thứ tự: ngành – lớp, quân khu – đơn vị, rồi tiểu đoàn – đại đội. Các lựa chọn phía sau sẽ tự lọc theo lựa chọn trước.</div>
      {/* Mã số học viên */}
      <div>
        <label className="field-label">Mã số học viên</label>

        <input
          type="text"
          name="maSoHV"
          value={form.maSoHV}
          onChange={handleChange}
          placeholder="Nhập mã số học viên"
          className="field-control"
        />
      </div>
      {/* Tên học viên */}
      <div>
        <label className="field-label">Tên học viên</label>

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nhập tên học viên"
          className="field-control"
        />
      </div>
      <div>
        <label className="field-label">Quân khu</label>
        <select
          name="quanKhuId"
          value={form.quanKhuId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              quanKhuId: e.target.value,
              donViCap2Id: "",
            }))
          }
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
      <div>
        <label className="field-label">Sư đoàn/Lữ đoàn</label>
        <select
          name="donViCap2Id"
          value={form.donViCap2Id}
          onChange={handleChange}
          disabled={!form.quanKhuId}
          className="field-control disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {form.quanKhuId ? "-- Chọn đơn vị --" : "-- Chọn quân khu trước --"}
          </option>
          {filteredSubUnits.map((item) => (
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
      <div>
        <label className="field-label">Tiểu đoàn</label>
        <select
          value={form.tieuDoanId}
          onChange={(e) =>
            setForm((p) => ({ ...p, tieuDoanId: e.target.value, daiDoiId: "" }))
          }
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
      <div>
        <label className="field-label">Đại đội quản lý lớp</label>
        <select
          value={form.daiDoiId}
          onChange={(e) => setForm((p) => ({ ...p, daiDoiId: e.target.value, majorId: "", classId: "" }))}
          disabled={!form.tieuDoanId}
          className="field-control disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {form.tieuDoanId
              ? "-- Chọn Đại đội --"
              : "-- Chọn Tiểu đoàn trước --"}
          </option>
          {filteredDaiDoi.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nameDaiDoi}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Chuyên ngành</label>
        <select name="majorId" value={form.majorId} onChange={handleMajorChange} disabled={!form.daiDoiId} className="field-control disabled:bg-slate-100 disabled:text-slate-400">
          <option value="">{form.daiDoiId ? "-- Chọn chuyên ngành --" : "-- Chọn Đại đội trước --"}</option>
          {availableMajors.map((major) => <option key={major.id} value={major.id}>{major.name}</option>)}
        </select>
      </div>
      <div>
        <label className="field-label">Lớp học</label>
        <select name="classId" value={form.classId} onChange={handleChange} disabled={!form.majorId} className="field-control disabled:bg-slate-100 disabled:text-slate-400">
          <option value="">{form.majorId ? "-- Chọn lớp học --" : "-- Chọn chuyên ngành trước --"}</option>
          {filteredClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
      {/* Chức vụ */}
      <div>
        <label className="field-label">Chức vụ</label>

        <select
          name="chucVu"
          value={form.chucVu}
          onChange={handleChange}
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

      {/* Dân tộc */}
      <div>
        <label className="field-label">Dân tộc</label>

        <input
          type="text"
          name="danToc"
          value={form.danToc}
          onChange={handleChange}
          placeholder="Nhập dân tộc"
          className="field-control"
        />
      </div>
      {/* Ngày sinh */}
      <div>
        <label className="field-label">Ngày sinh</label>

        <input
          type="date"
          name="birthDay"
          value={form.birthDay}
          onChange={handleChange}
          className="field-control"
        />
      </div>
      {/* Cấp bậc */}

      <div>
        <label className="field-label">Cấp bậc</label>

        <select
          name="capBac"
          value={form.capBac}
          onChange={handleChange}
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
      <StudentProfileExtraFields value={form} onChange={handleExtraChange} />
      {/* Button */}
      <div className="sticky bottom-0 -mx-1 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-1 pt-5 backdrop-blur">
        <Button type="button" variant="outline" onClick={onClose}>
          Hủy
        </Button>

        <Button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        >
          Thêm học viên
        </Button>
      </div>
    </form>
  );
}
