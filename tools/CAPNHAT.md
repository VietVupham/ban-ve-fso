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
- Shop có 2 phiên bản hiển thị: `ver:'t'` (file thực hiện, chunk `s<doc>_n`, doc `008`) và `ver:'d'` (bản scan duyệt, chunk `s<doc>d_n`, doc `008d`). QR luôn trỏ `#s-<doc>-<trang>` = bản thực hiện. BPTC: tab thực hiện = tài liệu có `st` (đang trình), tab duyệt = còn lại.
- Tải PDF được dựng ngay trên máy từ ảnh các trang (không lưu PDF gốc trên repo).

## Thông báo đẩy sau mỗi lần cập nhật (bắt buộc)
- Sau MỖI lần cập nhật (bản vẽ shop, BPTC, thiết kế, đặt hàng, QR): ghi 1 dòng nội dung ngắn vào `tools/notify.txt` (ví dụ "Đã cập nhật QR đợt 8 + mặt bằng tầng 1") và đổi giờ `updated` trong `version.json` (kể cả khi chỉ cập nhật QR, để workflow chạy). Commit + push cùng lúc.
- Workflow `.github/workflows/push.yml` tự gửi thông báo tới mọi máy đã bật (bảng `push_subs` trên Supabase, secret VAPID_PRIVATE + PUSH_TOKEN). Xem kết quả ở tab Actions của repo.
- Có thể gửi tay: Actions > Thong bao cap nhat > Run workflow, nhập nội dung.

## Cập nhật QR đợt mới (tự đặt vị trí lên mặt bằng thiết kế)
- Stage `07. QR tìm thép/<thư mục đợt>` và bản vẽ thiết kế tầng mới nhất (`02. Bản vẽ thiết kế`).
- Chạy: `python3 tools/qr_batch.py "<thư mục đợt>" /home/claude/thep-qr-b1/index.html /home/claude/ban-ve-fso/qr/index.html --design <pdf thiết kế tầng 1>`
  (đọc mã QR, thêm tem, dựng mặt bằng tầng 1 từ bản thiết kế 02-106, đặt pin theo nhãn dầm; in ra cấu kiện không thấy nhãn để xử lý tay). Chép lại index.html cho cả 2 repo, commit, push.
- Khi có bản vẽ shop dầm tầng 1: rà soát, ghép chi tiết thép (details) vào từng cấu kiện để quét QR ra chi tiết thép; việc này chưa làm vì shop tầng 1 chưa có trên Drive.

## Zone tầng 1 (tự động)
Nguồn ranh Zone: BPTC cốp pha dầm sàn T1 (MOS.029) trang "Mặt bằng chia Zone, lỗ mở và mạch ngừng". Ranh được căn lên mặt bằng thiết kế bằng các nhãn dầm trùng nhau (scale ≈2.177); mỗi ghim có `z`, tem có "ZONE x.y" trong tên đơn hàng chỉ hiện đoạn thuộc Zone đó. Khi BPTC đổi ranh, cập nhật hàm zone() rồi chạy lại.

## QUY TẮC AN TOÀN: tầng 1 ≠ hầm B1
Tem có "1F" / "TẦNG 1" trong tên đơn hàng hoặc cấu kiện bắt đầu "L1." thì `findDetail()` (qr/index.html) chỉ được lấy chi tiết có `floor:'L1'`. Khi nhập bản vẽ shop tầng 1 phải gắn `floor:'L1'` cho từng trang chi tiết; tuyệt đối không dùng chi tiết hầm B1 cho tem tầng 1.
