# Tổng quan dự án Quản lý học viên

## 1. Mục đích

Đây là hệ thống quản lý học viên cho đơn vị/trường đào tạo trong môi trường quân đội. Hệ thống quản lý học viên, ngành đào tạo, lớp học, đơn vị, cấp bậc và quy trình phê duyệt nâng cấp bậc.

Bản đang phát triển chính nằm trong thư mục `cdhc2.2`.

## 2. Công nghệ

- Next.js 16 và App Router.
- React 19.
- TypeScript.
- Tailwind CSS.
- JSON Server dùng làm database prototype.
- `docx` để tạo file Word.
- `jszip` để đóng nhiều file Word thành một file ZIP.

## 3. Các trang chính

| Route            | Chức năng              |
| ---------------- | ---------------------- |
| `/`              | Quản lý học viên       |
| `/classes`       | Quản lý lớp học        |
| `/ranks`         | Quản lý cấp bậc        |
| `/rank-approval` | Phê duyệt nâng cấp bậc |

## 4. Quản lý học viên

Trang `/` hỗ trợ:

- Thêm, sửa, xóa học viên.
- Xem chi tiết học viên.
- Sửa nhiều học viên cùng lúc.
- Tìm kiếm theo tên hoặc mã số.
- Lọc theo đại đội và lớp.
- Phân trang.

Thông tin học viên gồm:

```text
id, maSoHV, name, majorId, classId, donVi,
chucVu, danToc, birthDay, capBac
```

Sửa nhiều học viên dùng `PATCH`, chỉ cập nhật các trường được chọn, tránh ghi đè dữ liệu mới.

## 5. Quản lý lớp học

Trang `/classes` hỗ trợ tìm kiếm, lọc theo ngành, thêm, sửa, xóa và phân trang lớp học.

Hệ thống không cho xóa lớp nếu vẫn còn học viên đang tham chiếu tới lớp đó.

Quan hệ dữ liệu:

```text
majors.id  -> classes.majorId
classes.id -> students.classId
```

## 6. Quản lý cấp bậc

Trang `/ranks` hỗ trợ thêm, sửa, xóa, xem chi tiết, tìm kiếm và lọc cấp bậc.

Danh sách cấp bậc được sắp xếp bằng `rankOrder`:

```text
1. Binh nhì
2. Binh nhất
3. Hạ sỹ
4. Trung sỹ
5. Thượng sỹ
6. Thiếu úy
7. Trung úy
8. Thượng úy
9. Đại úy
10. Thiếu tá
11. Trung tá
12. Thượng tá
13. Đại tá
```

Mỗi cấp bậc có tên, nhóm và thứ tự hiển thị.

## 7. Phê duyệt nâng cấp bậc

Trang `/rank-approval` có các tab nằm trong cùng một page:

- Chờ duyệt.
- Yêu cầu sửa.
- Đã duyệt.
- Đã từ chối.

Một hồ sơ nâng cấp gồm học viên, mã số, đối tượng, cấp bậc hiện tại, cấp bậc đề nghị, lý do, thời gian gửi, trạng thái và ghi chú xử lý.

Quy trình:

```text
Lập hồ sơ
   -> Chờ duyệt
       -> Yêu cầu sửa
       -> Từ chối
       -> Duyệt
              -> Cập nhật capBac của học viên
```

Có thể chọn nhiều hồ sơ để duyệt tập thể bằng checkbox.

## 8. Xuất quyết định Word

Việc xuất Word chỉ thực hiện trong tab `Đã duyệt`, không còn ở trang quản lý học viên.

Khi chọn nhiều hồ sơ, API `/api/export-rank-decisions` tạo một file Word riêng cho từng học viên rồi đóng tất cả thành ZIP.

Ví dụ:

```text
quyet-dinh-thang-cap-tap-the.zip
├── quyet-dinh-001-Nguyen-Van-A.docx
├── quyet-dinh-002-Tran-Van-B.docx
└── quyet-dinh-003-Le-Van-C.docx
```

Mỗi file gồm họ tên, mã học viên, đối tượng, cấp bậc cũ, cấp bậc mới, ngày quyết định, lý do và khu vực ký tên.

API liên quan:

```text
/api/export-word
/api/export-rank-decisions
```

## 9. Database prototype

Dữ liệu hiện nằm trong `db.json`, gồm các collection:

```text
daiDoi
majors
classes
students
ranks
rankRequests
```

Các ID đã được chuẩn hóa thành chuỗi. `maSoHV` cũng dùng chuỗi để không mất số 0 đầu.

## 10. Quy tắc cấp bậc hiện dùng

Chuỗi cấp bậc hạ sĩ quan, binh sĩ:

```text
Binh nhì -> Binh nhất -> Hạ sỹ -> Trung sỹ -> Thượng sỹ
```

Hệ thống hiện quản lý hồ sơ và trạng thái phê duyệt. Để tự động kiểm tra đủ thời hạn 6 hoặc 12 tháng, cần bổ sung ngày bắt đầu giữ cấp bậc và các thông tin liên quan như kết quả đào tạo, kỷ luật và thành tích.

## 11. Chạy dự án

Terminal 1:

```bash
cd cdhc2.2
npm install
npm run json-server
```

Terminal 2:

```bash
cd cdhc2.2
npm run dev
```

Kiểm tra:

```bash
npm run build
npm run lint
```

JSON Server chạy ở cổng `3001`; Next.js thường chạy ở cổng `3000`.

## 12. API dữ liệu mẫu

```text
GET    /students
POST   /students
PATCH  /students/:id
DELETE /students/:id

GET    /rankRequests
POST   /rankRequests
PATCH  /rankRequests/:id
```

## 13. Hướng phát triển tiếp theo

- Chức năng tốt nghiệp sẽ có 2 chức năng nếu không điều chuyển công tác thì quân khu nào trả về quân khu đó còn điều chuyển thì chuyển về quân khu khác ví dụ nếu được đi học từ quân khu 7 nhưng điều chỉnh công tác sang quân khu 9. Từ đó ra thêm chức năng quản lý quân khu, sư đoàn , lữ đoàn, bộ tư lệnh,.... khi thêm học sinh sẽ phải chọn nơi đến quân khu để sau làm chức năng thuyên chuyển công tác cho dễ
- Thay JSON Server bằng PostgreSQL hoặc MySQL.
- Thêm đăng nhập và phân quyền.
- Thêm lịch sử thay đổi cấp bậc.
- Thêm ngày hiệu lực cấp bậc để tự động kiểm tra thời hạn.
- Chống tạo hồ sơ nâng cấp trùng.
- Hoàn thiện mẫu quyết định theo thể thức hành chính chính thức.

## 14. Tình trạng kiểm tra

`npm run build` đã chạy thành công. `npm run lint` không còn lỗi chặn build; cảnh báo còn lại thuộc trang thử nghiệm `/product`.
