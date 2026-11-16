# Quy trình cập nhật (Claude chạy khi chủ app nhắn "cập nhật bản vẽ")
1. Stage 2 thư mục Drive: `G:\My Drive\FSO-QLTK\01. BPTC\DUYET` -> /mnt/user-data/uploads/DUYET ; `G:\My Drive\FSO-QLTK\07. QR tìm thép` -> /mnt/user-data/uploads/07. QR tìm thép
2. Shop: ext_shop.py -> build_shop.py -> idx_shop.py (ra shop_pages.json + site/data/shop.json)
3. BPTC: build_data.py (bỏ file PDF hỏng, OCR trang không có chữ) -> site/data/bptc.json
4. pack.py: render ảnh (shop 3600px q72, BPTC 1800px q60) thành gói data/c/*.txt + version.json (có giờ cập nhật + hash từng gói)
5. Chép site/ vào repo, commit, git push -> GitHub Pages tự cập nhật; app trên điện thoại tự đồng bộ hoặc bấm nút ⟳.
Chỉ gói có hash đổi mới được tải lại.
