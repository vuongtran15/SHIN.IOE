# Học từ vựng tiếng Anh lớp 1

Ứng dụng flashcard và quiz cho bé lớp 1, viết bằng React + Vite. Giao diện tiếng Việt, chữ Times New Roman, nút to để dùng trên máy tính bảng. Bé có thể lật thẻ, nghe phát âm, chọn A B C, điền chữ, gõ cả từ hoặc câu, và luyện `a` / `an`.

Danh sách mẫu có **61 mục** (53 từ + 8 câu), giống bản HTML gốc.

## Chạy trên máy

Cần Node.js 18 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra, thường là http://localhost:5173.

## Kiểm tra và bản dựng

```bash
npm test
npm run build
npm run preview
```

`npm test` kiểm tra cách đọc danh sách từ, cách ẩn chữ (câu chỉ ẩn một từ) và luật `a` / `an`.

`npm run build` tạo thư mục tĩnh `dist`.

## Đưa lên Vercel

Không cần `vercel.json`. Ứng dụng là một trang tĩnh, không có đường dẫn phía trình duyệt.

| Mục | Giá trị |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## Sửa danh sách từ trong app

1. Bấm **Danh sách từ của bé**.
2. Mỗi dòng một từ hoặc một câu: `english - nghia`.
3. Bấm **Lưu danh sách**. Danh sách được giữ trên máy này (trình duyệt lưu bằng `localStorage`, khóa `flashcard-lop1-words`).
4. Bấm **Khôi phục từ mẫu** để lấy lại 61 mục gốc.

Nghĩa có thể bỏ trống, ví dụ chỉ viết `apple`.

Dấu phân cách được nhận, theo thứ tự ưu tiên:

- ` - ` (gạch ngang, có dấu cách hai bên)
- ` – ` (gạch en)
- ` — ` (gạch em)
- tab
- `:`
- `,`

Câu có dấu phẩy phải có ` - ` trước nghĩa, nếu không dấu phẩy bị hiểu là dấu tách:

```text
Bye, Bill. - Tạm biệt, Bill.
Hi, I am Bill. - Xin chào, tôi là Bill.
```

## Sửa danh sách mẫu trong mã

Mở `src/data/defaults.ts`. Mỗi phần tử là một cặp `[tiếng Anh, nghĩa tiếng Việt]`. Sau khi sửa, chạy lại `npm run dev` hoặc dựng lại bản production. Nếu máy đã lưu danh sách cũ, vào màn danh sách và bấm **Khôi phục từ mẫu**.

Luật ẩn chữ, đọc dòng và `a` / `an` nằm ở `src/lib/logic.ts`. Phần giao diện nằm ở `src/screens.tsx` và `src/App.tsx`.

## Thêm vào màn hình chính máy tính bảng

Bản đã dựng có `manifest.webmanifest`, biểu tượng trong `public/icons` và service worker. Trên máy tính bảng, mở trang bằng trình duyệt rồi chọn **Thêm vào màn hình chính** / **Add to Home Screen**. Ứng dụng mở toàn màn hình, nút và ô gõ chữ lớn. Khi bé gõ, ô nhập được giữ phía trên bàn phím.

Máy không có giọng đọc tiếng Anh vẫn dùng được. Nút loa vẫn hiện, và trang báo là máy chưa đọc được.
