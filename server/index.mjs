import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { URL } from "node:url";
import ExcelJS from "exceljs";

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
  "graduationRequests",
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
  graduationRequests: "manage_graduation",
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
    return effectiveUser(db, db.users?.find((u) => u.id === data.sub && u.active !== false));
  } catch {
    return null;
  }
}
function allowed(user, permission) {
  return user?.role === "admin" || (permission === "manage_graduation" && user?.role === "company") || user?.permissions?.includes(permission);
}
function effectiveUser(db, user) {
  if (!user) return null;
  const permissions = rolePermissions(db, user.role);
  if (user.role === "company" && !permissions.includes("manage_graduation")) permissions.push("manage_graduation");
  return { ...user, permissions };
}
function idOf(x) {
  return String(x?.id ?? "");
}
function normalizeId(value) {
  return String(value ?? "").trim();
}
function isValidDestination(db, destination) {
  const regionId = normalizeId(destination?.region);
  const unitValue = normalizeId(destination?.unit);
  if (!regionId || !unitValue || !(db.quanKhu || []).some((item) => String(item.id) === regionId)) return false;
  const [source, unitId] = unitValue.split(":");
  const sourceUnits = source === "suDoan" ? db.suDoan || [] : source === "luDoan" ? db.luDoan || [] : [...(db.suDoan || []), ...(db.luDoan || [])];
  const unit = source && unitId ? sourceUnits.find((item) => String(item.id) === unitId) : sourceUnits.find((item) => String(item.id) === unitValue);
  return Boolean(unit && String(unit.idQuanKhu || "") === regionId);
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
function companiesForUser(db, user) {
  if (user.role === "company") return [String(user.unitId || "")];
  if (user.role === "battalion")
    return (db.daiDoi || [])
      .filter((item) => String(item.idTieuDoan) === String(user.unitId || ""))
      .map((item) => String(item.id));
  return null;
}
function isInUnitScope(db, user, resource, item) {
  if (["admin", "school"].includes(user.role)) return true;
  const companyIds = companiesForUser(db, user);
  if (resource === "students" || resource === "classes")
    return companyIds?.includes(String(item?.daiDoiId || "")) || false;
  if (resource === "daiDoi") {
    if (user.role === "battalion")
      return String(item?.idTieuDoan || "") === String(user.unitId || "");
    return String(item?.id || "") === String(user.unitId || "");
  }
  if (resource === "tieuDoan")
    return user.role === "battalion" && String(item?.id) === String(user.unitId || "");
  return true;
}
function visibleItems(db, user, resource, list) {
  if (["students", "classes", "daiDoi", "tieuDoan"].includes(resource))
    return list.filter((item) => isInUnitScope(db, user, resource, item));
  if (["rankRequests", "graduationTransfers"].includes(resource))
    return list.filter((item) => {
      const student = db.students?.find((student) => String(student.id) === String(item.studentId));
      return student && isInUnitScope(db, user, "students", student);
    });
  if (resource === "positionRequests")
    return list.filter((item) => {
      const linked = (item.studentIds || []).map((studentId) => db.students?.find((student) => String(student.id) === String(studentId))).filter(Boolean);
      return linked.length > 0 && linked.every((student) => isInUnitScope(db, user, "students", student));
    });
  if (resource === "graduationRequests")
    return list.filter((item) => {
      const linked = (item.items || []).map((entry) => db.students?.find((student) => String(student.id) === String(entry.studentId))).filter(Boolean);
      return linked.length > 0 && linked.every((student) => isInUnitScope(db, user, "students", student));
    });
  return list;
}
function publicUser(user) {
  const safe = { ...user };
  delete safe.password;
  return safe;
}
function rolePermissions(db, role) {
  return (db.permissionCatalog || [])
    .filter((permission) => permission.roles?.includes(role))
    .map((permission) => permission.id);
}
function validateUser(db, input, current) {
  const candidate = { ...current, ...input };
  const validRoles = ["admin", "school", "battalion", "company"];
  const username = String(candidate.username || "").trim();
  const name = String(candidate.name || "").trim();
  if (!username || !name || !validRoles.includes(candidate.role))
    return "Tài khoản cần có tên đăng nhập, họ tên và vai trò hợp lệ";
  if ((!current && String(candidate.password || "").length < 4) || (current && input.password !== undefined && String(input.password).length < 4))
    return "Mật khẩu phải có ít nhất 4 ký tự";
  if ((db.users || []).some((user) => user.id !== current?.id && String(user.username).toLowerCase() === username.toLowerCase()))
    return "Tên đăng nhập đã tồn tại";
  const unitId = String(candidate.unitId || "").trim();
  if (candidate.role === "company" && !(db.daiDoi || []).some((item) => String(item.id) === unitId))
    return "Cần chọn một Đại đội hợp lệ cho tài khoản chỉ huy Đại đội";
  if (candidate.role === "battalion" && !(db.tieuDoan || []).some((item) => String(item.id) === unitId))
    return "Cần chọn một Tiểu đoàn hợp lệ cho tài khoản chỉ huy Tiểu đoàn";
  return null;
}
function validateStudentImportRows(db, rows) {
  const required = ["maSoHV", "name", "majorId", "classId", "quanKhuId", "donViCap2Id", "tieuDoanId", "daiDoiId", "chucVu", "danToc", "birthDay", "capBac"];
  const knownCodes = new Set((db.students || []).map((student) => String(student.maSoHV || "").trim().toLocaleLowerCase()));
  const importedCodes = new Set();
  const errors = [];
  const validRows = [];
  for (const [index, raw] of rows.entries()) {
    const row = Object.fromEntries(Object.entries(raw || {}).map(([key, value]) => [key.trim(), typeof value === "string" ? value.trim() : String(value ?? "").trim()]));
    for (const key of ["majorId", "classId", "quanKhuId", "donViCap2Id", "tieuDoanId", "daiDoiId"]) row[key] = String(row[key] || "").split(" | ")[0].trim();
    const missing = required.filter((key) => !row[key]);
    const code = String(row.maSoHV || "").toLocaleLowerCase();
    let message = "";
    if (missing.length) message = `Thiếu cột bắt buộc: ${missing.join(", ")}`;
    else if (knownCodes.has(code) || importedCodes.has(code)) message = `Mã học viên ${row.maSoHV} đã tồn tại hoặc bị trùng trong tệp`;
    else if (!isValidStudentLink(db, row)) message = "Liên kết ngành, lớp, đơn vị, tiểu đoàn hoặc đại đội không hợp lệ";
    if (message) errors.push({ row: index + 2, maSoHV: row.maSoHV || "", message });
    else { importedCodes.add(code); validRows.push(row); }
  }
  return { errors, validRows };
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
    const safe = effectiveUser(db, user);
    delete safe.password;
    return json(res, 200, { user: safe, token: tokenFor(user) });
  }
  if (!PUBLIC.has(url.pathname)) {
    const user = auth(req, db);
    if (!user)
      return fail(res, 401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
    req.user = user;
  }
  if (url.pathname === "/auth/me" && req.method === "GET")
    return json(res, 200, { ...publicUser(req.user), password: req.user.password });
  if (url.pathname === "/auth/change-password" && req.method === "POST") {
    const input = await body(req);
    const currentPassword = String(input.currentPassword || "");
    const newPassword = String(input.newPassword || "");
    if (req.user.password !== currentPassword)
      return fail(res, 400, "Mật khẩu hiện tại không đúng");
    if (newPassword.length < 4)
      return fail(res, 400, "Mật khẩu mới phải có ít nhất 4 ký tự");
    const index = db.users.findIndex((account) => account.id === req.user.id);
    db.users[index] = { ...db.users[index], password: newPassword };
    writeDb(db);
    return json(res, 200, { message: "Đã cập nhật mật khẩu" });
  }
  if (url.pathname === "/imports/students/template" && req.method === "GET") {
    if (req.user.role !== "admin") return fail(res, 403, "Chỉ Admin được tải mẫu nhập dữ liệu");
    const columns = "maSoHV,name,birthDay,gioiTinh,danToc,tonGiao,sucKhoe,vanHoa,quanKhuId,donViCap2Id,tieuDoanId,daiDoiId,majorId,classId,chucVu,capBac,doiTuongDaoTao,trinhDoDaoTao,nganhDaoTao,namTotNghiep,xepLoai,nangKhieu,ngayNhapNgu,soHieuQuanNhan,soTheBHYT,ngayVaoDoan,ngayVaoDang,ngayChinhThuc,soCCCD,ngayCapCCCD,noiCapCCCD,hoTenCha,ngheNghiepCha,noiLamViecCha,sdtCha,hoTenMe,ngheNghiepMe,noiLamViecMe,sdtMe,hoTenVoChong,ngheNghiepVoChong,noiLamViecVoChong,sdtVoChong,queQuan,nguyenQuan,truQuan,diaChi,soDienThoai,nguoiBaoTin,diaChiBaoTin,sdtBaoTin,ngayTang,lyDoTang,ngayGiam,lyDoGiam".split(",");
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("HOC_VIEN", { views: [{ state: "frozen", ySplit: 3 }] }); const refs = workbook.addWorksheet("DANH_MUC");
    const company = db.daiDoi?.[0]; const classItem = db.classes?.find((item) => String(item.daiDoiId) === String(company?.id)) || db.classes?.[0]; const major = db.majors?.find((item) => String(item.id) === String(classItem?.majorId)) || db.majors?.[0]; const unit = [...(db.suDoan || []).map((item) => ({ ...item, source: "suDoan", label: item.nameSuDoan })), ...(db.luDoan || []).map((item) => ({ ...item, source: "luDoan", label: item.nameLuDoan }))][0]; const region = db.quanKhu?.find((item) => String(item.id) === String(unit?.idQuanKhu)) || db.quanKhu?.[0]; const battalion = db.tieuDoan?.find((item) => String(item.id) === String(company?.idTieuDoan));
    const lists = { quanKhuId: (db.quanKhu || []).map((item) => `${item.id} | ${item.nameQuanKhu}`), donViCap2Id: [...(db.suDoan || []).map((item) => `suDoan:${item.id} | ${item.nameSuDoan}`), ...(db.luDoan || []).map((item) => `luDoan:${item.id} | ${item.nameLuDoan}`)], tieuDoanId: (db.tieuDoan || []).map((item) => `${item.id} | ${item.nameTieuDoan}`), daiDoiId: (db.daiDoi || []).map((item) => `${item.id} | ${item.nameDaiDoi}`), majorId: (db.majors || []).map((item) => `${item.id} | ${item.name}`), classId: (db.classes || []).map((item) => `${item.id} | ${item.name}`), chucVu: (db.chucVu || []).map((item) => item.name), capBac: (db.ranks || []).map((item) => item.name) };
    let refCol = 1; const formulas = {}; for (const [key, values] of Object.entries(lists)) { refs.getCell(1, refCol).value = key; values.forEach((value, index) => { refs.getCell(index + 2, refCol).value = value; }); formulas[key] = `'DANH_MUC'!$${ExcelJS.utils?.getExcelAlpha?.(refCol) || String.fromCharCode(64 + refCol)}$2:$${ExcelJS.utils?.getExcelAlpha?.(refCol) || String.fromCharCode(64 + refCol)}$${Math.max(values.length + 1, 2)}`; refCol++; }
    refs.state = "hidden"; sheet.mergeCells(1, 1, 1, columns.length); sheet.getCell("A1").value = "MẪU NHẬP DỮ LIỆU HỌC VIÊN"; sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } }; sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } }; sheet.getCell("A1").alignment = { horizontal: "center" }; sheet.mergeCells(2, 1, 2, columns.length); sheet.getCell("A2").value = "Các ô có danh sách chọn sẵn. Hãy chọn đúng mã | tên; hệ thống tự lấy phần mã khi nhập. Cột bắt buộc: maSoHV, name, birthDay, danToc và toàn bộ mã liên kết."; sheet.getCell("A2").alignment = { wrapText: true }; sheet.addRow(columns); const example = { maSoHV: "HV2026-001", name: "Nguyễn Minh Anh", birthDay: "2004-08-15", gioiTinh: "Nam", danToc: "Kinh", tonGiao: "Không", sucKhoe: "Loại 1", vanHoa: "12/12", quanKhuId: region ? `${region.id} | ${region.nameQuanKhu}` : "", donViCap2Id: unit ? `${unit.source}:${unit.id} | ${unit.label}` : "", tieuDoanId: battalion ? `${battalion.id} | ${battalion.nameTieuDoan}` : "", daiDoiId: company ? `${company.id} | ${company.nameDaiDoi}` : "", majorId: major ? `${major.id} | ${major.name}` : "", classId: classItem ? `${classItem.id} | ${classItem.name}` : "", chucVu: (db.chucVu || []).find((item) => item.name === "Học viên")?.name || "Học viên", capBac: db.ranks?.[0]?.name || "Binh nhì", ngayNhapNgu: "2023-02-10", soHieuQuanNhan: "QN-2023-00125", soCCCD: "001204012345", queQuan: "Nam Định", diaChi: "Nam Từ Liêm, Hà Nội", soDienThoai: "0987654321" }; sheet.addRow(columns.map((key) => example[key] || "")); sheet.getRow(3).eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }; cell.alignment = { wrapText: true, horizontal: "center" }; }); sheet.getRow(4).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }; }); columns.forEach((key, index) => { const column = sheet.getColumn(index + 1); column.width = Math.max(16, Math.min(28, key.length + 8)); const formula = formulas[key] || ({ gioiTinh: '"Nam,Nữ"', tonGiao: '"Không,Phật giáo,Công giáo,Tin Lành"', sucKhoe: '"Loại 1,Loại 2,Loại 3,Loại 4,Loại 5"', vanHoa: '"12/12,Trung cấp,Cao đẳng,Đại học"' })[key]; if (formula) for (let row = 4; row <= 5003; row++) sheet.getCell(row, index + 1).dataValidation = { type: "list", allowBlank: true, formulae: [formula] }; }); const buffer = await workbook.xlsx.writeBuffer(); res.writeHead(200, { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": "attachment; filename*=UTF-8''mau-nhap-hoc-vien.xlsx", "access-control-allow-origin": "http://localhost:3000" }); return res.end(Buffer.from(buffer));
  }
  if (url.pathname === "/imports/students/preview" && req.method === "POST") {
    if (req.user.role !== "admin") return fail(res, 403, "Chỉ Admin được nhập dữ liệu học viên");
    const input = await body(req);
    const rows = Array.isArray(input.rows) ? input.rows : [];
    if (!rows.length) return fail(res, 400, "Tệp không có dòng dữ liệu học viên");
    if (rows.length > 5000) return fail(res, 400, "Mỗi lần chỉ được nhập tối đa 5.000 học viên");
    const result = validateStudentImportRows(db, rows);
    return json(res, 200, { total: rows.length, valid: result.validRows.length, errors: result.errors });
  }
  if (url.pathname === "/imports/students/commit" && req.method === "POST") {
    if (req.user.role !== "admin") return fail(res, 403, "Chỉ Admin được nhập dữ liệu học viên");
    const input = await body(req);
    const rows = Array.isArray(input.rows) ? input.rows : [];
    if (!rows.length) return fail(res, 400, "Tệp không có dòng dữ liệu học viên");
    if (rows.length > 5000) return fail(res, 400, "Mỗi lần chỉ được nhập tối đa 5.000 học viên");
    const result = validateStudentImportRows(db, rows);
    if (result.errors.length) return json(res, 400, { error: "Tệp còn lỗi; hãy sửa trước khi xác nhận nhập", total: rows.length, valid: result.validRows.length, errors: result.errors });
    db.students ||= [];
    const createdAt = new Date().toISOString();
    const imported = result.validRows.map((row) => {
      const company = db.daiDoi.find((item) => String(item.id) === String(row.daiDoiId));
      return { ...row, id: randomUUID(), donVi: company?.nameDaiDoi || "", donViCu: row.donViCu || row.donViCap2Id, originQuanKhuId: row.originQuanKhuId || row.quanKhuId, originDonViCap2Id: row.originDonViCap2Id || row.donViCap2Id, importedAt: createdAt, importedBy: req.user.id };
    });
    db.students.push(...imported);
    writeDb(db);
    return json(res, 201, { imported: imported.length });
  }
  if (!collections.has(resource))
    return fail(res, 404, "Không tìm thấy tài nguyên");
  const list = Array.isArray(db[resource]) ? db[resource] : [];
  if (req.method === "GET") {
    if (["users", "permissionCatalog"].includes(resource) && !allowed(req.user, "manage_permissions"))
      return fail(res, 403, "Không có quyền xem dữ liệu phân quyền");
    const visible = visibleItems(db, req.user, resource, list);
    if (id) {
      const item = visible.find((x) => idOf(x) === id);
      return item
        ? json(res, 200, resource === "users" ? publicUser(item) : item)
        : fail(res, 404, "Không tìm thấy dữ liệu");
    }
    return json(res, 200, resource === "users" ? visible.map(publicUser) : visible);
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
      if (student.graduationStatus === "graduated")
        return fail(res, 400, "Không thể lập hồ sơ nâng cấp cho học viên đã tốt nghiệp");
      if (!isInUnitScope(db, user, "students", student))
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
      if (students.some((student) => !isInUnitScope(db, user, "students", student))) return fail(res, 403, "Có học viên không thuộc phạm vi đơn vị bạn quản lý");
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
  if (resource === "graduationRequests") {
    const linkedStudents = (request) => (request.items || []).map((entry) => db.students?.find((student) => String(student.id) === String(entry.studentId))).filter(Boolean);
    if (req.method === "POST") {
      if (!allowed(user, "manage_graduation")) return fail(res, 403, "Không có quyền lập hồ sơ tốt nghiệp");
      const items = Array.isArray(input.items) ? input.items : [];
      if (!items.length) return fail(res, 400, "Cần chọn ít nhất một học viên");
      const ids = new Set();
      for (const entry of items) {
        const student = db.students?.find((item) => String(item.id) === String(entry.studentId));
        if (!student || student.graduationStatus === "graduated" || ids.has(String(entry.studentId)) || !isInUnitScope(db, user, "students", student)) return fail(res, 403, "Có học viên không thuộc phạm vi hoặc không hợp lệ");
        if (!["return", "transfer"].includes(entry.type) || !isValidDestination(db, entry.target)) return fail(res, 400, "Đơn vị nhận không hợp lệ hoặc không thuộc Quân khu đã chọn");
        ids.add(String(entry.studentId));
      }
      const request = { id: randomUUID(), items: items.map((entry) => ({ studentId: String(entry.studentId), type: entry.type, target: { region: String(entry.target.region), unit: String(entry.target.unit) } })), status: "pending", approvalStage: user.role === "admin" ? "school" : "battalion", submittedBy: user.id, submittedByRole: user.role, submittedAt: new Date().toISOString() };
      db.graduationRequests ||= []; db.graduationRequests.push(request); writeDb(db); return json(res, 201, request);
    }
    if (!id || !["PATCH", "PUT"].includes(req.method)) return fail(res, 405, "Thao tác không hợp lệ");
    const index = list.findIndex((item) => idOf(item) === id); if (index < 0) return fail(res, 404, "Không tìm thấy hồ sơ");
    const current = list[index]; const students = linkedStudents(current);
    if (students.length !== current.items.length || !students.every((student) => isInUnitScope(db, user, "students", student))) return fail(res, 403, "Hồ sơ không thuộc phạm vi đơn vị bạn quản lý");
    if (user.role === "battalion") {
      if (current.approvalStage !== "battalion" || !allowed(user, "submit_school") || input.approvalStage !== "school") return fail(res, 403, "Tiểu đoàn chỉ được chuyển hồ sơ thuộc đơn vị mình lên Nhà trường");
      list[index] = { ...current, approvalStage: "school", status: "pending", forwardedBy: user.id, forwardedAt: new Date().toISOString() };
    } else if (["school", "admin"].includes(user.role)) {
      if (current.status !== "pending" || (user.role === "school" && current.approvalStage !== "school") || !["approved", "rejected"].includes(input.status)) return fail(res, 403, "Nhà trường chỉ duyệt hoặc từ chối hồ sơ đang chờ");
      const next = { ...current, status: input.status, approvalStage: "completed", reviewerNote: String(input.reviewerNote || ""), reviewedBy: user.id, reviewedAt: new Date().toISOString() };
      if (input.status === "approved") for (const entry of current.items) { const student = db.students.find((item) => String(item.id) === String(entry.studentId)); student.graduationStatus = "graduated"; student.graduatedAt = next.reviewedAt; student.originQuanKhuId ||= student.quanKhuId || ""; student.originDonViCap2Id ||= student.donViCap2Id || ""; student.quanKhuId = entry.target.region; student.donViCap2Id = entry.target.unit; db.graduationTransfers ||= []; db.graduationTransfers.push({ id: randomUUID(), studentId: student.id, studentName: student.name, maSoHV: student.maSoHV, type: entry.type, fromQuanKhuId: student.originQuanKhuId, toQuanKhuId: entry.target.region, fromDonViCap2Id: student.originDonViCap2Id, toDonViCap2Id: entry.target.unit, createdAt: next.reviewedAt }); }
      list[index] = next;
    } else if (user.role !== "admin") return fail(res, 403, "Không có quyền xử lý hồ sơ");
    else list[index] = { ...current, ...input, reviewedBy: user.id, reviewedAt: new Date().toISOString() };
    writeDb(db); return json(res, 200, list[index]);
  }
  if (!allowed(user, permission))
    return fail(res, 403, "Không có quyền thực hiện thao tác này");
  if (["company", "battalion"].includes(user.role) && ["majors", "ranks", "chucVu", "quanKhu", "suDoan", "luDoan", "tieuDoan"].includes(resource))
    return fail(res, 403, "Chỉ Nhà trường hoặc Admin được thay đổi danh mục toàn hệ thống");
  if (resource === "permissionCatalog") {
    const current = id ? list.find((item) => idOf(item) === id) : null;
    if (id && !current) return fail(res, 404, "Không tìm thấy quyền");
    const next = { ...current, ...input, id: current?.id || input.id || randomUUID() };
    if (!String(next.name || "").trim() || !Array.isArray(next.roles) || next.roles.some((role) => !["admin", "school", "battalion", "company"].includes(role)))
      return fail(res, 400, "Thông tin quyền không hợp lệ");
    if (!current) list.push(next);
    else list[list.indexOf(current)] = next;
    db.permissionCatalog = list;
    db.users = (db.users || []).map((account) => ({ ...account, permissions: rolePermissions(db, account.role) }));
    writeDb(db);
    return json(res, current ? 200 : 201, next);
  }
  if (resource === "users") {
    if (req.method === "DELETE") {
      const current = list.find((item) => idOf(item) === id);
      if (!current) return fail(res, 404, "Không tìm thấy tài khoản");
      if (current.id === user.id) return fail(res, 400, "Không thể xóa tài khoản đang đăng nhập");
      list.splice(list.indexOf(current), 1);
      writeDb(db);
      return json(res, 200, {});
    }
    const current = id ? list.find((item) => idOf(item) === id) : null;
    if (id && !current) return fail(res, 404, "Không tìm thấy tài khoản");
    const error = validateUser(db, input, current);
    if (error) return fail(res, 400, error);
    const next = {
      ...current,
      ...input,
      id: current?.id || input.id || randomUUID(),
      username: String(input.username ?? current?.username).trim(),
      name: String(input.name ?? current?.name).trim(),
      unitId: ["company", "battalion"].includes(input.role ?? current?.role) ? String(input.unitId ?? current?.unitId ?? "").trim() : "",
      permissions: rolePermissions(db, input.role ?? current?.role),
    };
    if (!current) list.push(next);
    else list[list.indexOf(current)] = next;
    db.users = list;
    writeDb(db);
    return json(res, current ? 200 : 201, publicUser(next));
  }
  if (resource === "graduationTransfers") {
    const current = id ? list.find((item) => idOf(item) === id) : null;
    const studentId = input.studentId || current?.studentId;
    const student = db.students?.find((item) => String(item.id) === String(studentId));
    if (!student || !isInUnitScope(db, user, "students", student))
      return fail(res, 403, "Học viên không thuộc phạm vi đơn vị bạn quản lý");
  }
  if (["students", "classes", "daiDoi", "tieuDoan"].includes(resource)) {
    const current = id ? list.find((item) => idOf(item) === id) : null;
    if (current && !isInUnitScope(db, user, resource, current))
      return fail(res, 403, "Dữ liệu không thuộc phạm vi đơn vị bạn quản lý");
    if (req.method !== "DELETE") {
      const candidate = req.method === "PATCH" ? { ...current, ...input } : input;
      if (!isInUnitScope(db, user, resource, candidate))
        return fail(res, 403, "Chỉ được thao tác dữ liệu thuộc phạm vi đơn vị bạn quản lý");
    }
    if (resource === "tieuDoan" && user.role === "battalion")
      return fail(res, 403, "Tiểu đoàn không được tự thay đổi thông tin cấp Tiểu đoàn");
  }
  if (resource === "students" && req.method !== "GET") {
    if (
      input.graduationStatus === "graduated" &&
      id &&
      list.find((item) => idOf(item) === id)?.graduationStatus === "graduated"
    )
      return fail(res, 409, "Học viên này đã được ghi nhận tốt nghiệp");
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
  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    const current = id ? list.find((item) => idOf(item) === id) : null;
    const candidate = req.method === "PATCH" ? { ...current, ...input } : input;
    const name = String(candidate?.name || "").trim();
    const duplicate = (items, matcher) =>
      items?.some((item) => idOf(item) !== idOf(current) && matcher(item));

    if (resource === "classes") {
      if (!name || !candidate.majorId || !candidate.daiDoiId)
        return fail(res, 400, "Lớp học cần có tên, chuyên ngành và Đại đội quản lý");
      if (!db.majors?.some((item) => idOf(item) === String(candidate.majorId)))
        return fail(res, 400, "Chuyên ngành của lớp học không tồn tại");
      if (!db.daiDoi?.some((item) => idOf(item) === String(candidate.daiDoiId)))
        return fail(res, 400, "Đại đội quản lý lớp học không tồn tại");
      if (duplicate(list, (item) => String(item.name).trim().toLocaleLowerCase() === name.toLocaleLowerCase() && String(item.majorId) === String(candidate.majorId) && String(item.daiDoiId) === String(candidate.daiDoiId)))
        return fail(res, 409, "Lớp học này đã tồn tại trong chuyên ngành và Đại đội đã chọn");
    }
    if (resource === "daiDoi") {
      if (!String(candidate.nameDaiDoi || "").trim() || !candidate.idTieuDoan)
        return fail(res, 400, "Đại đội cần có tên và Tiểu đoàn quản lý");
      if (!db.tieuDoan?.some((item) => idOf(item) === String(candidate.idTieuDoan)))
        return fail(res, 400, "Tiểu đoàn quản lý Đại đội không tồn tại");
    }
    if (resource === "tieuDoan" && !String(candidate.nameTieuDoan || "").trim())
      return fail(res, 400, "Tiểu đoàn cần có tên");
    if (resource === "chucVu" && !name)
      return fail(res, 400, "Chức vụ không được để trống");
    if (resource === "majors" && (!name || !String(candidate.shortName || "").trim()))
      return fail(res, 400, "Chuyên ngành cần có tên và mã viết tắt");
    if (resource === "ranks") {
      if (!name || !Number.isInteger(Number(candidate.rankOrder)) || Number(candidate.rankOrder) < 1)
        return fail(res, 400, "Cấp bậc cần có tên và thứ tự là số nguyên dương");
      if (!["Hạ sĩ quan, binh sĩ", "Sĩ quan"].includes(candidate.group))
        return fail(res, 400, "Nhóm cấp bậc không hợp lệ");
    }
  }
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method))
    return fail(res, 405, "Thao tác không hợp lệ");
  if (req.method === "DELETE") {
    const index = list.findIndex((x) => idOf(x) === id);
    if (index < 0) return fail(res, 404, "Không tìm thấy dữ liệu");
    const item = list[index];
    if (resource === "majors" && db.classes?.some((x) => String(x.majorId) === id))
      return fail(res, 409, "Không thể xóa chuyên ngành đang có lớp học");
    if (resource === "students" && (
      db.rankRequests?.some((x) => String(x.studentId) === id) ||
      db.positionRequests?.some((x) => (x.studentIds || []).map(String).includes(String(id))) ||
      db.graduationRequests?.some((x) => (x.items || []).some((entry) => String(entry.studentId) === id)) ||
      db.graduationTransfers?.some((x) => String(x.studentId) === id)
    )) return fail(res, 409, "Không thể xóa học viên đang có hồ sơ hoặc lịch sử quyết định liên quan");
    if (resource === "classes" && db.students?.some((x) => String(x.classId) === id))
      return fail(res, 409, "Không thể xóa lớp học đang có học viên");
    if (resource === "tieuDoan" && (db.daiDoi?.some((x) => String(x.idTieuDoan) === id) || db.users?.some((x) => x.role === "battalion" && String(x.unitId) === id)))
      return fail(res, 409, "Không thể xóa Tiểu đoàn đang có Đại đội hoặc tài khoản trực thuộc");
    if (resource === "daiDoi" && (db.classes?.some((x) => String(x.daiDoiId) === id) || db.students?.some((x) => String(x.daiDoiId) === id) || db.users?.some((x) => x.role === "company" && String(x.unitId) === id)))
      return fail(res, 409, "Không thể xóa Đại đội đang có lớp, học viên hoặc tài khoản trực thuộc");
    if (resource === "chucVu" && (db.students?.some((x) => x.chucVu === item.name) || db.positionRequests?.some((x) => x.positionId === item.id)))
      return fail(res, 409, "Không thể xóa chức vụ đang được học viên hoặc hồ sơ bổ nhiệm sử dụng");
    if (resource === "ranks" && (db.students?.some((x) => x.capBac === item.name) || db.rankRequests?.some((x) => x.currentRank === item.name || x.proposedRank === item.name)))
      return fail(res, 409, "Không thể xóa cấp bậc đang được sử dụng");
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
