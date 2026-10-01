import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { URL } from "node:url";

const PORT = Number(process.env.API_PORT || 3001);
const LEGACY_DB_FILE = new URL("../db.json", import.meta.url);
const SQLITE_FILE = new URL("../data/app.sqlite", import.meta.url);
const SQLITE_PATH = fileURLToPath(SQLITE_FILE);
mkdirSync(fileURLToPath(new URL("../data/", import.meta.url)), {
  recursive: true,
});
const sqlite = new DatabaseSync(SQLITE_PATH);
sqlite.exec(
  `CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (collection, id))`,
);
const existingRows = sqlite
  .prepare("SELECT COUNT(*) AS count FROM records")
  .get();
if (Number(existingRows.count) === 0) {
  const legacy = JSON.parse(await readFile(LEGACY_DB_FILE, "utf8"));
  const insert = sqlite.prepare(
    "INSERT INTO records (collection, id, data) VALUES (?, ?, ?)",
  );
  for (const [collection, value] of Object.entries(legacy)) {
    if (!Array.isArray(value)) continue;
    for (const item of value)
      insert.run(collection, String(item.id), JSON.stringify(item));
  }
  console.log("Imported db.json into data/app.sqlite");
}
const SECRET = process.env.API_SECRET || "change-this-development-secret";
const PUBLIC = new Set(["/health", "/auth/login"]);
const collections = new Set([
  "students",
  "majors",
  "classes",
  "ranks",
  "rankRequests",
  "positionRequests",
  "quanKhu",
  "suDoan",
  "luDoan",
  "tieuDoan",
  "daiDoi",
  "chucVu",
  "graduationTransfers",
  "users",
  "permissionCatalog",
]);
const permissionByCollection = {
  students: "manage_students",
  classes: "manage_classes",
  majors: "manage_majors",
  ranks: "manage_students",
  positionRequests: "create_rank_request",
  quanKhu: "manage_units",
  suDoan: "manage_units",
  luDoan: "manage_units",
  tieuDoan: "manage_units",
  daiDoi: "manage_units",
  chucVu: "manage_units",
  graduationTransfers: "manage_graduation",
  permissionCatalog: "manage_permissions",
  users: "manage_permissions",
};

function readDb() {
  const db = {};
  for (const row of sqlite
    .prepare("SELECT collection, data FROM records ORDER BY rowid")
    .all()) {
    (db[row.collection] ||= []).push(JSON.parse(row.data));
  }
  return db;
}
function writeDb(db) {
  sqlite.exec("BEGIN");
  try {
    sqlite.exec("DELETE FROM records");
    const insert = sqlite.prepare(
      "INSERT INTO records (collection, id, data) VALUES (?, ?, ?)",
    );
    for (const [collection, value] of Object.entries(db)) {
      if (!Array.isArray(value)) continue;
      for (const item of value)
        insert.run(collection, String(item.id), JSON.stringify(item));
    }
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }
}
function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "http://localhost:3000",
    "access-control-allow-headers": "Content-Type, Authorization",
    "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  });
  res.end(text);
}
async function body(req) {
  let data = "";
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}
function tokenFor(user) {
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, exp: Date.now() + 8 * 60 * 60 * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function auth(req, db) {
  const value = req.headers.authorization || "";
  const [payload, sig] = value.replace(/^Bearer /, "").split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  )
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return (
      db.users?.find((u) => u.id === data.sub && u.active !== false) || null
    );
  } catch {
    return null;
  }
}
function allowed(user, permission) {
  return user?.role === "admin" || user?.permissions?.includes(permission);
}
function idOf(x) {
  return String(x?.id ?? "");
}
function normalizeId(value) {
  return String(value ?? "").trim();
}
function isValidStudentLink(db, input) {
  if (!input || !input.majorId || !input.classId) return false;
  const majorExists = db.majors?.some(
    (item) => String(item.id) === String(input.majorId),
  );
  if (!majorExists) return false;
  const classExists = db.classes?.some(
    (item) =>
      String(item.id) === String(input.classId) &&
      String(item.majorId) === String(input.majorId),
  );
  if (!classExists) return false;
  if (
    !input.quanKhuId ||
    !db.quanKhu?.some((item) => String(item.id) === String(input.quanKhuId))
  )
    return false;
  if (!input.donViCap2Id) return false;
  const unitValue = normalizeId(input.donViCap2Id);
  if (!unitValue) return false;
  const [source, id] = unitValue.split(":");
  const units = [];
  if (source === "suDoan") units.push(...(db.suDoan || []));
  if (source === "luDoan") units.push(...(db.luDoan || []));
  let unit;
  if (!source || !id) {
    unit = [...(db.suDoan || []), ...(db.luDoan || [])].find(
      (item) => String(item.id) === String(unitValue),
    );
  } else {
    unit = units.find((item) => String(item.id) === String(id));
  }
  if (!unit) return false;
  if (String(unit.idQuanKhu || "") !== String(input.quanKhuId)) return false;
  if (
    !input.tieuDoanId ||
    !db.tieuDoan?.some((item) => String(item.id) === String(input.tieuDoanId))
  )
    return false;
  if (!input.daiDoiId) return false;
  const company = db.daiDoi?.find(
    (item) => String(item.id) === String(input.daiDoiId),
  );
  if (!company) return false;
  if (String(company.idTieuDoan || "") !== String(input.tieuDoanId))
    return false;
  const classItem = db.classes?.find((item) => String(item.id) === String(input.classId));
  if (!classItem?.daiDoiId || String(classItem.daiDoiId) !== String(input.daiDoiId)) return false;
  return true;
}
function studentFor(db, request) {
  return db.students?.find((s) => String(s.id) === String(request.studentId));
}
function battalionOwns(db, user, request) {
  const student = studentFor(db, request);
  const company = db.daiDoi?.find(
    (x) => String(x.id) === String(student?.daiDoiId),
  );
  return (
    user.role === "battalion" &&
    String(company?.idTieuDoan || "") === String(user.unitId || "")
  );
}
function fail(res, status, message) {
  return json(res, status, { error: message });
}

async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[0];
  const id = parts[1];
  if (url.pathname === "/health") return json(res, 200, { ok: true });
  const db = readDb();
  if (url.pathname === "/auth/login" && req.method === "POST") {
    const input = await body(req);
    const user = db.users?.find(
      (x) =>
        x.username === String(input.username || "").trim() &&
        x.password === input.password &&
        x.active !== false,
    );
    if (!user) return fail(res, 401, "Sai tài khoản hoặc mật khẩu");
    const safe = { ...user };
    delete safe.password;
    return json(res, 200, { user: safe, token: tokenFor(user) });
  }
  if (!PUBLIC.has(url.pathname)) {
    const user = auth(req, db);
    if (!user)
      return fail(res, 401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
    req.user = user;
  }
  if (!collections.has(resource))
    return fail(res, 404, "Không tìm thấy tài nguyên");
  const list = Array.isArray(db[resource]) ? db[resource] : [];
  if (req.method === "GET") {
    if (id) {
      const item = list.find((x) => idOf(x) === id);
      return item
        ? json(res, 200, item)
        : fail(res, 404, "Không tìm thấy dữ liệu");
    }
    return json(res, 200, list);
  }
  const user = req.user;
  const permission = permissionByCollection[resource];
  const input = ["POST", "PUT", "PATCH"].includes(req.method)
    ? await body(req)
    : {};
  if (resource === "rankRequests") {
    if (req.method === "POST") {
      if (!allowed(user, "create_rank_request"))
        return fail(res, 403, "Không có quyền lập hồ sơ");
      const student = studentFor(db, input);
      if (!student) return fail(res, 400, "Học viên không tồn tại");
      if (
        user.role === "company" &&
        String(student.daiDoiId) !== String(user.unitId)
      )
        return fail(res, 403, "Học viên không thuộc Đại đội của bạn");
      const item = {
        ...input,
        id: input.id || randomUUID(),
        status: "pending",
        approvalStage: "battalion",
        submittedBy: user.id,
        submittedByRole: user.role,
        submittedAt: input.submittedAt || new Date().toISOString(),
      };
      db.rankRequests.push(item);
      writeDb(db);
      return json(res, 201, item);
    }
    if (!["PATCH", "PUT"].includes(req.method) || !id)
      return fail(res, 405, "Thao tác không hợp lệ");
    const index = list.findIndex((x) => idOf(x) === id);
    if (index < 0) return fail(res, 404, "Không tìm thấy hồ sơ");
    const current = list[index];
    const nextStatus = input.status || current.status;
    if (user.role === "company") {
      if (
        current.submittedBy !== user.id ||
        !["revision_requested", "rejected"].includes(current.status)
      )
        return fail(res, 403, "Không thể sửa hồ sơ này");
      if (input.approvalStage && input.approvalStage !== "battalion")
        return fail(res, 403, "Hồ sơ phải quay lại Tiểu đoàn");
    } else if (user.role === "battalion") {
      if (
        !battalionOwns(db, user, current) ||
        current.approvalStage !== "battalion" ||
        !allowed(user, "submit_school") ||
        nextStatus !== "pending" ||
        input.approvalStage !== "school"
      )
        return fail(
          res,
          403,
          "Tiểu đoàn chỉ được chuyển hồ sơ thuộc đơn vị mình lên Nhà trường",
        );
    } else if (user.role === "school") {
      if (
        current.approvalStage !== "school" ||
        !allowed(user, "approve_school") ||
        !["approved", "revision_requested", "rejected"].includes(nextStatus)
      )
        return fail(res, 403, "Nhà trường chỉ xử lý hồ sơ đang chờ duyệt");
    } else if (user.role !== "admin")
      return fail(res, 403, "Không có quyền xử lý hồ sơ");
    const merged = {
      ...current,
      ...input,
      reviewedBy: user.id,
      reviewedByRole: user.role,
      reviewedAt: new Date().toISOString(),
    };
    if (user.role === "battalion") {
      merged.forwardedBy = user.id;
      merged.forwardedByRole = user.role;
      merged.forwardedAt = new Date().toISOString();
    }
    if (nextStatus === "approved") {
      if (!studentFor(db, current))
        return fail(res, 400, "Hồ sơ mất liên kết học viên");
      merged.approvalStage = "completed";
      const student = studentFor(db, current);
      student.capBac = current.proposedRank;
    }
    list[index] = merged;
    writeDb(db);
    return json(res, 200, merged);
  }
  if (resource === "positionRequests") {
    const requestStudents = (request) =>
      (request.studentIds || [])
        .map((studentId) => db.students?.find((student) => String(student.id) === String(studentId)))
        .filter(Boolean);
    if (req.method === "POST") {
      if (!allowed(user, "create_rank_request")) return fail(res, 403, "Không có quyền lập hồ sơ bổ nhiệm");
      const studentIds = [...new Set((input.studentIds || []).map(String))];
      const students = studentIds.map((studentId) => db.students?.find((student) => String(student.id) === studentId)).filter(Boolean);
      const position = db.chucVu?.find((item) => String(item.id) === String(input.positionId));
      if (!position || !students.length || students.length !== studentIds.length) return fail(res, 400, "Thiếu chức vụ hoặc học viên liên kết");
      if (!String(input.reason || "").trim()) return fail(res, 400, "Cần nêu căn cứ hoặc ý kiến đề nghị");
      if (students.some((student) => student.graduationStatus === "graduated")) return fail(res, 400, "Không thể lập hồ sơ bổ nhiệm cho học viên đã tốt nghiệp");
      if (!["individual", "collective"].includes(input.appointmentType)) return fail(res, 400, "Loại bổ nhiệm không hợp lệ");
      if (input.appointmentType === "individual" && students.length !== 1) return fail(res, 400, "Bổ nhiệm cá nhân chỉ gồm một học viên");
      if (input.appointmentType === "collective" && students.length < 2) return fail(res, 400, "Bổ nhiệm tập thể cần từ hai học viên");
      if (user.role === "company" && students.some((student) => String(student.daiDoiId) !== String(user.unitId))) return fail(res, 403, "Học viên không thuộc Đại đội của bạn");
      const classIds = [...new Set(students.map((student) => String(student.classId)))];
      const classItem = classIds.length === 1 ? db.classes?.find((item) => String(item.id) === classIds[0]) : null;
      const item = { id: randomUUID(), appointmentType: input.appointmentType, positionId: position.id, positionName: position.name, studentIds, students: students.map((student) => ({ id: student.id, name: student.name, maSoHV: student.maSoHV, classId: student.classId, daiDoiId: student.daiDoiId })), classId: classItem?.id || null, className: classItem?.name || null, totalStudents: students.length, reason: String(input.reason || "").trim(), status: "pending", approvalStage: "battalion", submittedBy: user.id, submittedByRole: user.role, submittedAt: new Date().toISOString() };
      db.positionRequests ||= [];
      db.positionRequests.push(item); writeDb(db); return json(res, 201, item);
    }
    if (!id || !["PATCH", "PUT"].includes(req.method)) return fail(res, 405, "Thao tác không hợp lệ");
    const index = list.findIndex((item) => idOf(item) === id); if (index < 0) return fail(res, 404, "Không tìm thấy hồ sơ");
    const current = list[index]; const students = requestStudents(current); const nextStatus = input.status || current.status;
    const belongsToBattalion = user.role === "battalion" && students.length > 0 && students.every((student) => { const company = db.daiDoi?.find((item) => String(item.id) === String(student.daiDoiId)); return String(company?.idTieuDoan) === String(user.unitId); });
    if (user.role === "company") {
      if (
        current.submittedBy !== user.id ||
        !["revision_requested", "rejected"].includes(current.status) ||
        nextStatus !== "pending" ||
        (input.approvalStage && input.approvalStage !== "battalion")
      ) return fail(res, 403, "Đại đội chỉ được gửi lại hồ sơ cần chỉnh sửa");
    }
    else if (user.role === "battalion") { if (!belongsToBattalion || current.approvalStage !== "battalion" || !allowed(user, "submit_school") || input.approvalStage !== "school" || nextStatus !== "pending") return fail(res, 403, "Tiểu đoàn chỉ được chuyển hồ sơ thuộc đơn vị mình"); }
    else if (user.role === "school") { if (current.approvalStage !== "school" || !allowed(user, "approve_school") || !["approved", "revision_requested", "rejected"].includes(nextStatus)) return fail(res, 403, "Nhà trường chỉ xử lý hồ sơ chờ duyệt"); }
    else if (user.role !== "admin") return fail(res, 403, "Không có quyền xử lý hồ sơ");
    list[index] = {
      ...current,
      ...input,
      id: current.id,
      studentIds: current.studentIds,
      students: current.students,
      positionId: current.positionId,
      positionName: current.positionName,
      submittedBy: current.submittedBy,
      submittedByRole: current.submittedByRole,
      submittedAt: current.submittedAt,
      reviewedBy: user.id,
      reviewedByRole: user.role,
      reviewedAt: new Date().toISOString(),
    };
    if (user.role === "battalion") Object.assign(list[index], { forwardedBy: user.id, forwardedAt: new Date().toISOString(), forwardedByRole: user.role });
    if (nextStatus === "approved") {
      if (students.length !== current.studentIds.length)
        return fail(res, 400, "Hồ sơ mất liên kết học viên");
      list[index].approvalStage = "completed";
      for (const student of students) student.chucVu = current.positionName;
    }
    writeDb(db); return json(res, 200, list[index]);
  }
  if (!allowed(user, permission))
    return fail(res, 403, "Không có quyền thực hiện thao tác này");
  if (resource === "students" && req.method !== "GET") {
    if (
      input.capBac &&
      Object.keys(input).every((k) => ["capBac"].includes(k)) &&
      user.role !== "school" &&
      user.role !== "admin"
    )
      return fail(res, 403, "Cấp bậc chỉ được cập nhật qua Nhà trường");
    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      const studentInput = {
        ...(req.method === "PATCH" ? list.find((x) => idOf(x) === id) || {} : {}),
        ...input,
      };
      if (
        !studentInput.maSoHV ||
        !studentInput.name ||
        !studentInput.majorId ||
        !studentInput.classId ||
        !studentInput.quanKhuId ||
        !studentInput.donViCap2Id ||
        !studentInput.tieuDoanId ||
        !studentInput.daiDoiId ||
        !studentInput.chucVu ||
        !studentInput.danToc ||
        !studentInput.birthDay ||
        !studentInput.capBac
      ) {
        return fail(
          res,
          400,
          "Thiếu thông tin bắt buộc hoặc thiếu liên kết dữ liệu học viên",
        );
      }
      if (!isValidStudentLink(db, studentInput)) {
        return fail(
          res,
          400,
          "Dữ liệu học viên không khớp với khóa liên kết ngành, lớp, đơn vị và tiểu đoàn/đại đội",
        );
      }
    }
  }
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method))
    return fail(res, 405, "Thao tác không hợp lệ");
  if (req.method === "DELETE") {
    const index = list.findIndex((x) => idOf(x) === id);
    if (index < 0) return fail(res, 404, "Không tìm thấy dữ liệu");
    list.splice(index, 1);
    writeDb(db);
    return json(res, 200, {});
  }
  if (req.method === "POST") {
    const item = { ...input, id: input.id || randomUUID() };
    list.push(item);
    db[resource] = list;
    writeDb(db);
    return json(res, 201, item);
  }
  const index = list.findIndex((x) => idOf(x) === id);
  if (index < 0) return fail(res, 404, "Không tìm thấy dữ liệu");
  list[index] =
    req.method === "PUT" ? { ...input, id } : { ...list[index], ...input, id };
  writeDb(db);
  return json(res, 200, list[index]);
}
let requestQueue = Promise.resolve();
createServer((req, res) => {
  // Các thao tác đang lưu snapshot toàn bộ collection; tuần tự hóa request
  // để hai thao tác đồng thời không ghi đè dữ liệu của nhau.
  requestQueue = requestQueue
    .then(() => handler(req, res))
    .catch((error) => {
      console.error(error);
      fail(res, 500, "Lỗi máy chủ");
    });
}).listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
