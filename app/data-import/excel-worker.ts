import * as XLSX from "xlsx";

type RequestData = { buffer: ArrayBuffer };

self.onmessage = (event: MessageEvent<RequestData>) => {
  try {
    const book = XLSX.read(event.data.buffer, { type: "array", cellDates: false });
    const sheet = book.Sheets[book.SheetNames.includes("HOC_VIEN") ? "HOC_VIEN" : book.SheetNames[0]];
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
    const header = grid.findIndex((line) => String(line[0] || "").startsWith("maSoHV"));
    if (header < 0) throw new Error("Không tìm thấy hàng tiêu đề maSoHV. Hãy dùng file mẫu của hệ thống.");
    const keys = grid[header].map((value) => String(value || "").split("\n")[0].trim());
    const rows = grid.slice(header + 1).map((line) => Object.fromEntries(keys.map((key, index) => [key, String(line[index] || "").trim()]))).filter((row) => Object.values(row).some(Boolean));
    self.postMessage({ rows });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Không thể đọc tệp Excel" });
  }
};
