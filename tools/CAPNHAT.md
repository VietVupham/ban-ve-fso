# Quy trình cập nhật (Claude chạy khi chủ app nhắn "cập nhật bản vẽ")
1. Stage 2 thư mục Drive: `G:\My Drive\FSO-QLTK\01. BPTC\DUYET` -> /mnt/user-data/uploads/DUYET ; `G:\My Drive\FSO-QLTK\07. QR tìm thép` -> /mnt/user-data/uploads/07. QR tìm thép
2. Shop: ext_shop.py -> build_shop.py -> idx_shop.py (ra shop_pages.json + site/data/shop.json)
3. BPTC: build_data.py (bỏ file PDF hỏng, OCR trang không có chữ) -> site/data/bptc.json
4. pack.py: render ảnh (shop 3600px q72, BPTC 1800px q60) thành gói data/c/*.txt + version.json (có giờ cập nhật + hash từng gói)
5. Chép site/ vào repo, commit, git push -> GitHub Pages tự cập nhật; app trên điện thoại tự đồng bộ hoặc bấm nút ⟳.
Chỉ gói có hash đổi mới được tải lại.

## Tab "Tra thép QR"
Là bản sao của repo riêng `VietVupham/thep-qr-b1` (index.html + thư mục d/) đặt trong `qr/`. Khi app QR được cập nhật (đẩy vào thep-qr-b1), chép lại index.html và d/ sang `qr/` rồi push repo này. App nhúng bằng iframe (cho phép camera).

## Quy tắc bổ sung (từ 11/2026): file thực hiện vs file duyệt
- Thư mục stage thêm: `07. QR tìm thép/4-2-1--FILE-THUC-HIEN` (shop thực hiện), `4-2-2--DUYET/SDW.STR` (shop scan duyệt), `01. BPTC/CHUA DUYET` (BPTC thực hiện), `01. BPTC/DUYET`, `07…/03. Đặt hàng thép/ĐH-xxx`.
- File duyệt là chuẩn. So sánh file thực hiện với bản scan duyệt (khớp nội dung/số trang): KHỚP -> dùng PDF thực hiện (nét hơn); KHÔNG KHỚP -> dùng bản scan duyệt. File thực hiện không có trong thư mục duyệt = "Đang trình" (cờ `st`), vẫn đưa lên.
- Shop: trang có nhãn "CẬP NHẬT THIẾT KẾ" được xoá nhãn khỏi ảnh và gắn cờ `up` (app hiện ghi chú nhỏ "check lại thiết kế cập nhật").
- Đặt hàng thép: mỗi đợt `ĐH-xxx` có mặt bằng theo dõi (pdf), tổng hợp khối lượng, bảng theo Ø, danh sách cấu kiện (từ xlsx) -> `data/order.json` + chunk `o<id>_0`. Tab "Đặt hàng thép".
- Tăng `V` trong sw.js mỗi lần triển khai.
