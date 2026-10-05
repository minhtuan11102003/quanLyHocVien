/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession, type SessionUser } from "@/components/AuthGate";

type Status = "pending" | "revision_requested" | "approved" | "rejected";
type Student = {
  id: string;
  name: string;
  maSoHV: string;
  majorId: string;
  classId: string;
  daiDoiId?: string;
  graduationStatus?: string;
};
type ClassItem = {
  id: string;
  name: string;
  majorId: string;
  daiDoiId?: string;
};
type Company = { id: string; nameDaiDoi: string; idTieuDoan?: string };
type Major = { id: string; name: string; shortName?: string };
type Position = { id: string; name: string };
type Request = {
  id: string;
  appointmentType: "individual" | "collective";
  positionId: string;
  positionName: string;
  studentIds: string[];
  students: Student[];
  totalStudents: number;
  className?: string | null;
  reason: string;
  status: Status;
  approvalStage?: "battalion" | "school" | "completed";
  submittedAt: string;
  submittedBy?: string;
  reviewerNote?: string;
};
const API = "http://localhost:3001";
const tabs: { key: Status; label: string }[] = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "revision_requested", label: "Yêu cầu sửa" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Đã từ chối" },
];

export default function PositionApprovalPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [status, setStatus] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [filterMajorId, setFilterMajorId] = useState("all");
  const [filterClassId, setFilterClassId] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Request | null>(null);
  const [exportTarget, setExportTarget] = useState<Request | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [signedDate, setSignedDate] = useState("");
  const [signerName, setSignerName] = useState("");
  const [exportingWord, setExportingWord] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [type, setType] = useState<"individual" | "collective">("individual");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [classId, setClassId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const load = async () => {
    const results = await Promise.all(
      [
        "positionRequests",
        "students",
        "classes",
        "daiDoi",
        "majors",
        "chucVu",
      ].map((path) => fetch(`${API}/${path}`)),
    );
    const data = await Promise.all(
      results.map((result) => (result.ok ? result.json() : [])),
    );
    setRequests(data[0]);
    setStudents(data[1]);
    setClasses(data[2]);
    setCompanies(data[3]);
    setMajors(data[4]);
    setPositions(data[5]);
  };
  useEffect(() => {
    setSession(getSession());
    load().catch(console.error);
  }, []);
  useEffect(() => {
    if (session?.role === "company") setCompanyId(String(session.unitId || ""));
  }, [session]);
  const hasPermission = (permission: string) =>
    session?.role === "admin" ||
    Boolean(session?.permissions?.includes(permission));
  const stageOf = (request: Request) =>
    request.status === "approved"
      ? "completed"
      : request.approvalStage || "battalion";
  const linked = (request: Request) =>
    request.studentIds
      .map((id) =>
        students.find((student) => String(student.id) === String(id)),
      )
      .filter(Boolean) as Student[];
  const belongs = (request: Request) =>
    session?.role === "battalion" &&
    linked(request).length > 0 &&
    linked(request).every(
      (student) =>
        String(
          companies.find(
            (company) => String(company.id) === String(student.daiDoiId),
          )?.idTieuDoan || "",
        ) === String(session.unitId || ""),
    );
  const canCreate =
    session?.role === "admin" ||
    (session?.role === "company" && hasPermission("create_rank_request"));
  const canForward = (request: Request) =>
    session?.role === "battalion" &&
    stageOf(request) === "battalion" &&
    belongs(request) &&
    hasPermission("submit_school");
  const canReview = (request: Request) =>
    session?.role === "admin" ||
    (session?.role === "school" &&
      stageOf(request) === "school" &&
      hasPermission("approve_school"));
  const canResubmit = (request: Request) =>
    session?.role === "company" &&
    request.submittedBy === session.id &&
    ["revision_requested", "rejected"].includes(request.status);
  const visible = requests.filter((request) => {
    const isVisibleToRole =
      session?.role === "admin" ||
      (session?.role === "company" && request.submittedBy === session.id) ||
      (session?.role === "battalion" && belongs(request)) ||
      (session?.role === "school" &&
        ["school", "completed"].includes(stageOf(request)));
    const text =
      `${request.positionName} ${request.students.map((student) => `${student.name} ${student.maSoHV}`).join(" ")}`.toLocaleLowerCase();
    return (
      request.status === status &&
      isVisibleToRole &&
      (filterMajorId === "all" ||
        linked(request).some(
          (student) => String(student.majorId) === String(filterMajorId),
        )) &&
      (filterClassId === "all" ||
        linked(request).some(
          (student) => String(student.classId) === String(filterClassId),
        )) &&
      (!search.trim() || text.includes(search.trim().toLocaleLowerCase()))
    );
  });
  const filterClasses = classes.filter(
    (item) =>
      filterMajorId === "all" ||
      String(item.majorId) === String(filterMajorId),
  );
  const allSelected =
    visible.length > 0 &&
    visible.every((request) => selectedIds.includes(request.id));
  const counts = useMemo(
    () =>
      Object.fromEntries(
        tabs.map((tab) => [
          tab.key,
          requests.filter((request) => request.status === tab.key).length,
        ]),
      ) as Record<Status, number>,
    [requests],
  );
  const eligible = students.filter(
    (student) =>
      student.graduationStatus !== "graduated" &&
      (session?.role !== "company" ||
        String(student.daiDoiId) === String(session.unitId)) &&
      (!companyId || String(student.daiDoiId) === String(companyId)) &&
      (!majorId || String(student.majorId) === String(majorId)) &&
      (!classId || String(student.classId) === String(classId)),
  );
  const formClasses = classes.filter(
    (item) =>
      (!companyId || String(item.daiDoiId) === String(companyId)) &&
      (!majorId || String(item.majorId) === String(majorId)),
  );
  const formMajors = majors.filter((major) =>
    classes.some(
      (item) =>
        String(item.majorId) === String(major.id) &&
        (!companyId || String(item.daiDoiId) === String(companyId)),
    ),
  );
  const process = async (
    request: Request,
    next: Status | "forward",
    actionNote = "",
  ) => {
    if (["revision_requested", "rejected"].includes(next) && !actionNote.trim())
      return alert("Vui lòng nhập ghi chú xử lý.");
    if (next === "forward" && !canForward(request))
      return alert("Bạn không có quyền chuyển hồ sơ này.");
    if (next !== "forward" && !canReview(request))
      return alert("Chỉ Nhà trường hoặc Admin được xử lý.");
    const response = await fetch(`${API}/positionRequests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: next === "forward" ? "pending" : next,
        approvalStage:
          next === "forward"
            ? "school"
            : next === "approved"
              ? "completed"
              : stageOf(request),
        reviewerNote: actionNote.trim(),
      }),
    });
    if (!response.ok)
      return alert(
        (await response.json().catch(() => null))?.error ||
          "Không thể xử lý hồ sơ.",
      );
    setSelected(null);
    await load();
  };
  const resubmit = async (request: Request) => {
    const response = await fetch(`${API}/positionRequests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "pending",
        approvalStage: "battalion",
        reason: request.reason,
        reviewerNote: "",
      }),
    });
    if (!response.ok) return alert("Không thể gửi lại hồ sơ.");
    setSelected(null);
    setStatus("pending");
    await load();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!positionId || !studentIds.length || !reason.trim())
      return alert("Hãy chọn chức vụ, học viên và căn cứ bổ nhiệm.");
    if (type === "collective" && studentIds.length < 2)
      return alert("Bổ nhiệm tập thể cần ít nhất 2 học viên.");
    const response = await fetch(`${API}/positionRequests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentType: type,
        positionId,
        studentIds,
        reason: reason.trim(),
      }),
    });
    if (!response.ok)
      return alert(
        (await response.json().catch(() => null))?.error ||
          "Không thể lập hồ sơ.",
      );
    setShowCreate(false);
    setStudentIds([]);
    setPositionId("");
    setReason("");
    setStatus("pending");
    await load();
  };
  const exportWord = async () => {
    if (!exportTarget) return;
    if (!documentNumber.trim() || !signedDate.trim() || !signerName.trim())
      return alert("Vui lòng nhập số văn bản, ngày ký và người ký.");
    setExportingWord(true);
    const student = linked(exportTarget)[0];
    const company = companies.find(
      (item) => String(item.id) === String(student?.daiDoiId),
    );
    try {
      const response = await fetch("/api/export-position-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            ...exportTarget,
            daiDoiName: company?.nameDaiDoi || "[ĐẠI ĐỘI QUẢN LÝ]",
          },
          documentNumber: documentNumber.trim(),
          signedDate: signedDate.trim(),
          signerName: signerName.trim(),
        }),
      });
      if (!response.ok) throw new Error("Không thể xuất Word.");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = `quyet-dinh-bo-nhiem-${exportTarget.id}.docx`;
      link.click();
      URL.revokeObjectURL(link.href);
      setExportTarget(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể xuất Word.");
    } finally {
      setExportingWord(false);
    }
  };
  return (
    <div className="page-shell">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-blue-600">
            Quy trình xét duyệt
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Phê duyệt bổ nhiệm chức vụ
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đại đội lập hồ sơ → Tiểu đoàn chuyển → Nhà trường phê duyệt cuối.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Lập hồ sơ
          </button>
        )}
      </div>
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        {session?.role === "company"
          ? "Đại đội: lập và theo dõi hồ sơ bổ nhiệm của đơn vị mình."
          : session?.role === "battalion"
            ? "Tiểu đoàn: kiểm tra và chuyển hồ sơ thuộc đơn vị lên Nhà trường."
            : "Nhà trường/Admin: phê duyệt, yêu cầu chỉnh sửa hoặc từ chối hồ sơ."}
      </div>
      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatus(tab.key);
              setSelectedIds([]);
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${status === tab.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
          >
            {tab.label}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${status === tab.key ? "bg-white/20" : "bg-slate-100"}`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>
      <div className="my-4 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm học viên hoặc chức vụ..."
          className="field-control min-w-60 flex-1"
        />
        <select
          value={filterMajorId}
          onChange={(event) => {
            setFilterMajorId(event.target.value);
            setFilterClassId("all");
            setSelectedIds([]);
          }}
          className="field-control w-auto min-w-[180px]"
        >
          <option value="all">Tất cả chuyên ngành</option>
          {majors.map((major) => (
            <option key={major.id} value={major.id}>{major.name}</option>
          ))}
        </select>
        <select
          value={filterClassId}
          disabled={filterMajorId === "all"}
          onChange={(event) => {
            setFilterClassId(event.target.value);
            setSelectedIds([]);
          }}
          className="field-control w-auto min-w-[160px] disabled:bg-slate-100"
        >
          <option value="all">Tất cả lớp học</option>
          {filterClasses.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <button
          onClick={() =>
            setSelectedIds(
              allSelected ? [] : visible.map((request) => request.id),
            )
          }
          className={`min-w-[180px] rounded-xl px-4 py-2.5 text-sm font-semibold transition ${allSelected ? "border border-blue-200 bg-blue-50 text-blue-700" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"}`}
        >
          {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </button>
        {status === "approved" && (
          <button
            onClick={() => {
              const chosen = visible.filter((item) => selectedIds.includes(item.id));
              if (chosen.length !== 1)
                return alert("Hãy chọn đúng một quyết định bổ nhiệm để xuất Word.");
              setExportTarget(chosen[0]);
              setDocumentNumber("");
              setSignedDate(new Date().toLocaleDateString("vi-VN"));
              setSignerName("");
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Xuất Word ({visible.filter((item) => selectedIds.includes(item.id)).length})
          </button>
        )}
      </div>
      <div className="table-shell max-h-[calc(100vh-300px)]">
        <table className="min-w-[960px] w-full">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelectedIds(
                      allSelected ? [] : visible.map((request) => request.id),
                    )
                  }
                />
              </th>
              <th>Học viên</th>
              <th>Chức vụ</th>
              <th>Hình thức</th>
              <th>Tiến độ</th>
              <th>Ngày gửi</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((request) => (
              <tr key={request.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(request.id)}
                    onChange={() =>
                      setSelectedIds((current) =>
                        current.includes(request.id)
                          ? current.filter((id) => id !== request.id)
                          : [...current, request.id],
                      )
                    }
                  />
                </td>
                <td>
                  {request.students.map((student) => (
                    <div key={student.id}>
                      <b>{student.name}</b>
                      <span className="ml-2 text-xs text-slate-500">
                        {student.maSoHV}
                      </span>
                    </div>
                  ))}
                </td>
                <td>{request.positionName}</td>
                <td>
                  {request.appointmentType === "collective"
                    ? "Tập thể"
                    : "Cá nhân"}
                </td>
                <td>
                  {request.status === "approved"
                    ? "Nhà trường đã duyệt"
                    : request.status === "revision_requested"
                      ? "Yêu cầu chỉnh sửa"
                      : request.status === "rejected"
                        ? "Đã từ chối"
                        : stageOf(request) === "battalion"
                          ? "Chờ Tiểu đoàn"
                          : "Chờ Nhà trường"}
                </td>
                <td>
                  {new Date(request.submittedAt).toLocaleDateString("vi-VN")}
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelected(request);
                        setNote("");
                      }}
                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      Xem / xử lý
                    </button>
                    {request.status === "approved" && (
                      <button
                        onClick={() => {
                          setExportTarget(request);
                          setDocumentNumber("");
                          setSignedDate(new Date().toLocaleDateString("vi-VN"));
                          setSignerName("");
                        }}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
                      >
                        Xuất Word
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Không có hồ sơ.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={submit} className="space-y-4 p-5">
            <h2 className="text-xl font-bold">Lập hồ sơ bổ nhiệm</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="field-label">
                Hình thức
                <select
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as typeof type);
                    setStudentIds([]);
                  }}
                  className="field-control mt-1"
                >
                  <option value="individual">Cá nhân</option>
                  <option value="collective">Tập thể</option>
                </select>
              </label>
              <label className="field-label">
                Chức vụ
                <select
                  value={positionId}
                  onChange={(event) => setPositionId(event.target.value)}
                  className="field-control mt-1"
                >
                  <option value="">-- Chọn chức vụ --</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                value={companyId}
                disabled={session?.role === "company"}
                onChange={(event) => {
                  setCompanyId(event.target.value);
                  setMajorId("");
                  setClassId("");
                  setStudentIds([]);
                }}
                className="field-control disabled:bg-slate-100"
              >
                <option value="">-- Chọn Đại đội --</option>
                {companies
                  .filter(
                    (company) =>
                      session?.role !== "company" ||
                      String(company.id) === String(session.unitId),
                  )
                  .map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nameDaiDoi}
                    </option>
                  ))}
              </select>
              <select
                value={majorId}
                disabled={!companyId}
                onChange={(event) => {
                  setMajorId(event.target.value);
                  setClassId("");
                  setStudentIds([]);
                }}
                className="field-control"
              >
                <option value="">-- Chọn chuyên ngành --</option>
                {formMajors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name}
                  </option>
                ))}
              </select>
              <select
                value={classId}
                disabled={!majorId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setStudentIds([]);
                }}
                className="field-control"
              >
                <option value="">-- Chọn lớp học --</option>
                {formClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border">
              <div className="flex items-center justify-between bg-slate-50 p-3 text-sm font-semibold">
                <span>
                  Học viên ({studentIds.length}/{eligible.length} đã chọn)
                </span>
                {type === "collective" && (
                  <button
                    type="button"
                    onClick={() =>
                      setStudentIds(
                        eligible.length &&
                          eligible.every((student) =>
                            studentIds.includes(student.id),
                          )
                          ? []
                          : eligible.map((student) => student.id),
                      )
                    }
                    className="text-blue-700"
                  >
                    {eligible.length &&
                    eligible.every((student) => studentIds.includes(student.id))
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </button>
                )}
              </div>
              {classId ? (
                <div className="max-h-56 overflow-y-auto">
                  {eligible.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-3 border-t p-3"
                    >
                      <input
                        type={type === "individual" ? "radio" : "checkbox"}
                        name="student"
                        checked={studentIds.includes(student.id)}
                        onChange={() =>
                          setStudentIds(
                            type === "individual"
                              ? [student.id]
                              : studentIds.includes(student.id)
                                ? studentIds.filter((id) => id !== student.id)
                                : [...studentIds, student.id],
                          )
                        }
                      />
                      <span>
                        <b>{student.name}</b>
                        <span className="ml-2 text-xs text-slate-500">
                          {student.maSoHV}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-sm text-slate-500">
                  Chọn Đại đội, chuyên ngành và lớp để hiển thị học viên.
                </p>
              )}
            </div>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="field-control"
              rows={4}
              placeholder="Căn cứ / ý kiến đề nghị..."
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border px-4 py-2"
              >
                Hủy
              </button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">
                Gửi chờ duyệt
              </button>
            </div>
          </form>
        </Modal>
      )}
      {exportTarget && (
        <Modal onClose={() => !exportingWord && setExportTarget(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              exportWord();
            }}
            className="space-y-5 p-6"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
                Xuất quyết định
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Thông tin văn bản xuất Word
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quyết định bổ nhiệm {exportTarget.positionName} cho{" "}
                {exportTarget.totalStudents} học viên.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label">
                Số văn bản
                <input
                  autoFocus
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  className="field-control mt-1"
                  placeholder="Ví dụ: 23/QĐ-CDHC2"
                />
              </label>
              <label className="field-label">
                Ngày ký
                <input
                  value={signedDate}
                  onChange={(event) => setSignedDate(event.target.value)}
                  className="field-control mt-1"
                  placeholder="05/10/2026"
                />
              </label>
            </div>
            <label className="field-label block">
              Người ký
              <input
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                className="field-control mt-1"
                placeholder="Ví dụ: Đại tá Nguyễn Văn A"
              />
            </label>
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setExportTarget(null)}
                disabled={exportingWord}
                className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                disabled={exportingWord}
                className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {exportingWord ? "Đang tạo file..." : "Xuất Word"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="space-y-4 p-5">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">Chi tiết hồ sơ bổ nhiệm</h2>
              <button onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="rounded-xl border p-3 text-sm">
              <p>
                <b>Chức vụ:</b> {selected.positionName}
              </p>
              <p>
                <b>Học viên:</b>{" "}
                {selected.students.map((student) => student.name).join(", ")}
              </p>
              <p>
                <b>Trạng thái:</b> {selected.status}
              </p>
            </div>
            {selected.status === "pending" &&
              (canReview(selected) || canForward(selected)) && (
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="field-control"
                  rows={3}
                  placeholder="Ghi chú (bắt buộc khi yêu cầu sửa/từ chối)"
                />
              )}
            {selected.reviewerNote && (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                Ghi chú: {selected.reviewerNote}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {selected.status === "pending" && canForward(selected) && (
                <button
                  onClick={() => process(selected, "forward")}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-white"
                >
                  Gửi Nhà trường
                </button>
              )}
              {selected.status === "pending" && canReview(selected) && (
                <>
                  <button
                    onClick={() =>
                      process(selected, "revision_requested", note)
                    }
                    className="rounded-lg bg-amber-500 px-3 py-2 text-white"
                  >
                    Yêu cầu sửa
                  </button>
                  <button
                    onClick={() => process(selected, "rejected", note)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-white"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => process(selected, "approved", note)}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-white"
                  >
                    Duyệt
                  </button>
                </>
              )}
              {canResubmit(selected) && (
                <button
                  onClick={() => resubmit(selected)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-white"
                >
                  Gửi lại
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
