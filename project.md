# Hiep Trong Space — Project Master Blueprint & Plain Plan

> **Tài liệu tổng hợp ý tưởng & kế hoạch xây dựng lại website từ đầu**  
> Dành cho AI Agent: Hãy đọc tài liệu này như một bản kế hoạch thuần túy (plain plan) từ góc nhìn của người dùng / chủ dự án. Bản kế hoạch này lưu giữ toàn bộ ý tưởng nguyên bản, các tính năng cần có, cách thức hoạt động và định hướng mỹ thuật UI/UX để bạn có thể bắt tay xây dựng lại toàn bộ ứng dụng sạch sẽ, có kiểm soát và đúng với linh hồn của dự án.

---

## 1. Tầm nhìn & Triết lý cốt lõi (Vision & Philosophy)

- **Không gian cá nhân một người dùng (Single-user Local Space):** Đây là một ứng dụng quản lý cuộc sống và học tập cá nhân chạy cục bộ, dành riêng cho một người dùng (Hiep Trong). Ứng dụng không cần hệ thống đăng nhập phức tạp, phân quyền nhiều người dùng hay các tính năng SaaS cồng kềnh.
- **Sự kết hợp giữa 2 thế giới:**
  1. *The Cosmos (Cổng vũ trụ / Trang chủ):* Một không gian 3D chiêm nghiệm, nghệ thuật, tĩnh lặng như viện bảo tàng vũ trụ, nơi người dùng bước vào thế giới riêng của mình trước khi mở ra các công cụ.
  2. *The Workspaces (Các xưởng làm việc):* Các không gian tập trung, ngăn nắp và thanh lịch cho từng khía cạnh cuộc sống: quản lý công việc hàng ngày, học tập, viết lách, theo dõi thói quen và lưu giữ kỷ niệm.
- **Không phải một bảng dashboard công nghiệp khô khan:** Ứng dụng phải giống như một "thánh đường số" (digital sanctuary) mang tính cá nhân hóa sâu sắc, tôn trọng nhịp sống và truyền cảm hứng làm việc mỗi ngày.

---

## 2. Nguyên tắc UI/UX chung (Design Language & Experience Principles)

- **Tone màu mềm dịu (Soft & Gentle Palette):** 
  - Tuyệt đối không dùng các gam màu chói lóa, màu neon gắt hay tương phản đập vào mắt. 
  - Các màu sắc phải có độ dịu mắt, ấm áp hoặc mát lành tùy theo chủ đề, tạo cảm giác thư giãn và bền bỉ khi làm việc lâu.
- **Mỗi tính năng là một "thế giới" riêng biệt (Unique Themed Spaces):**
  - Không rập khuôn một phong cách cho mọi trang. Mỗi không gian có một chủ đề và cảm xúc riêng (Vũ trụ, Rừng xanh, Gỗ mộc, Biển cả, Zen Nhật Bản, Châu Âu cổ đại...).
  - Dù khác nhau về chủ đề, tất cả vẫn phải hòa hợp trong cùng một tiêu chuẩn thẩm mỹ cao: bố cục thoáng đãng, khoảng cách tinh tế và font chữ trang nhã.
- **Chuyển động siêu mượt mà (Ultra-Smooth Motion):**
  - Mọi hiệu ứng chuyển cảnh giữa các trang hay đóng/mở cửa sổ đều phải êm ái, liền mạch, không giật cục.
  - Chuyển từ trang chủ vào các không gian làm việc giống như một cú lướt nhẹ nhàng qua không gian (Cosmic Launch).
- **Tinh tế, không rác thị giác (Clean Craft, No Visual Clutter / AI Slop):**
  - Không nhồi nhét hoa văn, icon SVG dày đặc gây rối mắt.
  - Tránh các đường viền cứng nhắc hay các chi tiết trang trí vô nghĩa. Mỗi chi tiết xuất hiện đều phải phục vụ cảm xúc hoặc công năng.

---

## 3. Khung điều hướng & Tiện ích chung (Global Shell & Controls)

- **Thanh điều hướng Workspace (Topbar Shell):**
  - Thanh tiêu đề tinh gọn nằm trên đầu các trang làm việc.
  - Hiển thị ngày giờ thực tế theo múi giờ cá nhân (`Asia/Ho_Chi_Minh`).
  - Điểm tựa nhanh để mở menu nhảy trang và xem thông báo.
- **Universe Menu (`Ctrl+K`):**
  - Menu phím tắt nhanh để dịch chuyển tức thời giữa 13 không gian tính năng từ bất kỳ đâu.
  - Thanh tìm kiếm thanh thoát, tối giản, hiển thị đẹp mắt và không có đường viền khung bao thô ráp.
- **Trung tâm thông báo (Notification Center):**
  - Nút chuông thông báo trên thanh topbar với chấm trạng thái báo tin chưa đọc.
  - Tự động tạo nhắc nhở cho các thời điểm quan trọng:
    - Nhắc trước hạn chót 24 giờ (hoặc khi thời gian còn lại chạm mốc 1/4 tổng thời gian công việc).
    - Cảnh báo khi công việc bị quá hạn.
    - Thông báo ghi nhận khi vừa hoàn thành một việc.
  - Mỗi thẻ thông báo hiển thị tiêu đề, nhãn phân loại màu sắc, thời gian tương đối (ví dụ: "2 ngày trước", "còn 3 giờ"), và nút tích chọn đánh dấu đã đọc.
  - Tự động dọn dẹp các thông báo cũ quá 7 ngày để giữ hộp thư luôn sạch sẽ.

---

## 4. Chi tiết các Không gian & Tính năng (Feature Catalog)

### NHÓM TÍNH NĂNG ƯU TIÊN HÀNG ĐẦU (PRIMARY)

#### 1. Homepage / The Cosmos Journey (Trang chủ & Cổng không gian)
- **Cảm hứng & Vibe UI:** Không gian vũ trụ sâu thẳm, quả địa cầu 3D ban đêm xoay êm ả giữa bầu trời sao, chữ thương hiệu "HIEP TRONG" trang trọng ngự trị phía đường chân trời.
- **Hoạt động & Trải nghiệm cuộn trang (3 giai đoạn mượt mà):**
  - *Mở đầu:* Quả địa cầu tự quay chậm rãi theo quỹ đạo, người dùng có thể nhấp chuột kéo xoay hoặc dùng phím mũi tên để tương tác ngắm nhìn.
  - *Giai đoạn 1:* Khi bắt đầu cuộn chuột, ánh sáng bình minh ấm áp dần ló rạng ở rìa quả đất, dòng chữ thương hiệu trôi nhẹ lên trên và mờ dần.
  - *Giai đoạn 2:* Tiếp tục cuộn, quả địa cầu chuyển dịch vị trí nhẹ nhàng sang một bên khung hình (vẫn tiếp tục quay êm ái), đồng thời đoạn văn bản / thông điệp suy tưởng ở phía đối diện sẽ dần dần hiện rõ từ từ với hiệu ứng tăng độ mờ mềm mại.
  - *Giai đoạn 3:* Cuộn tiếp, bối cảnh chuyển dịch êm ái sang một nền không gian mới với tông màu dịu nhẹ, mở ra bộ sưu tập các tính năng (Feature Gallery).
- **Bộ sưu tập tính năng (Explore my space):**
  - Trưng bày đầy đủ các thẻ đại diện cho 13 không gian làm việc cá nhân với biểu tượng nghệ thuật nhẹ nhàng.
  - Có nút chuyển đổi linh hoạt giữa 2 kiểu xem: Cuộn ngang (Horizontal) hoặc Lưới dọc (Vertical).
  - Nhấp vào bất kỳ thẻ nào sẽ kích hoạt hiệu ứng chuyển cảnh mượt mà để dẫn thẳng vào không gian đó.

#### 2. Daily Task Management (Quản lý công việc hàng ngày)
- **Cảm hứng & Vibe UI:** Đài quan sát thiên văn ban đêm (Celestial Observatory). Nền trời đêm huyền bí, kính mờ sang trọng, ánh vàng ấm áp của mặt trời và vì sao, chữ số serif thanh lịch. Giao diện sạch sẽ, loại bỏ mọi chi tiết SVG trang trí dày đặc không cần thiết.
- **Khu vực Đài quan sát tổng quan (Daily Dashboard):**
  - *Cosmic forecast:* Một lời nhắn, câu trích dẫn hoặc thông điệp chiêm nghiệm nhẹ nhàng mở đầu ngày mới.
  - *Tiến độ hôm nay:* Hiển thị phần trăm công việc đã hoàn thành trong ngày, số việc đã xong trên tổng số việc, cùng một thanh đo tiến độ phát sáng tinh tế.
  - *Cung thời gian trong ngày (Day arc):* Biểu đồ đường vòng cung theo dõi hành trình 24 giờ theo thời gian thực (múi giờ Hồ Chí Minh), hiển thị đồng hồ giờ-phút chính xác và đếm ngược thời gian tới nửa đêm.
- **Ba chế độ xem linh hoạt:**
  - *Chế độ Ngày (Active Day Carousel):* Băng chuyền 3 ngày (Hôm qua - Hôm nay - Ngày mai). Ngày hiện tại luôn ở trung tâm, sáng rõ và tương tác trực tiếp; hai ngày bên cạnh hiển thị mờ hơn để cung cấp bối cảnh. Cho phép thêm nhanh việc mới cho từng ngày. Danh sách công việc có chiều cao vừa vặn (khoảng 3.5 thẻ việc) với thanh cuộn chòm sao độc đáo.
  - *Chế độ Tuần (Week View):* Lưới 7 ngày (Thứ Hai đến Chủ Nhật). Mỗi ngày hiển thị vòng tròn tiến độ, thống kê theo mức độ ưu tiên (gấp, thường, tùy chọn) và số việc có hạn chót trong ngày. Nhấp vào ngày bất kỳ sẽ mở ngăn kéo xem toàn bộ danh sách việc của ngày đó.
  - *Chế độ Tháng (Month View):* Lịch 42 ô bao quát cả tháng, đánh dấu các ngày có công việc quá hạn hoặc khối lượng việc lớn. Nhấp vào ô lịch để mở ngăn kéo chi tiết.
- **Làn công việc quá hạn (Overdue Lane):**
  - Các công việc trong quá khứ chưa hoàn thành sẽ không nằm rải rác làm bẩn lịch cũ, mà tự động được gom vào một khu vực riêng biệt phía dưới trang làm việc.
  - Tính năng "Chuyển tiếp" (Transfer): Giúp người dùng xử lý nhanh việc quá hạn bằng cách dời sang một ngày mới và đặt lại hạn chót chỉ trong một thao tác bấm nút.

#### 3. Tasks Hub (Tổng kho & Trung tâm điều phối công việc)
- **Cảm hứng & Vibe UI:** Tông màu tím hoa cà dịu nhẹ (light lavender) trên nền giấy sáng màu. Không khí thanh mát, thư thái của ban ngày, đem lại cảm giác ngăn nắp và rõ ràng khi sắp xếp cuộc sống.
- **Tính năng & Cách hoạt động:**
  - Nơi lưu trữ toàn bộ công việc: cả những việc đã lên ngày làm cụ thể và những việc chờ xử lý (backlog).
  - Tìm kiếm công việc nhanh chóng theo từ khóa.
  - Bộ lọc thông minh: lọc theo trạng thái (chưa làm, đã xong, quá hạn, sắp đến hạn), theo mức độ ưu tiên (gấp, bình thường, tùy chọn), và theo trạng thái lên lịch.
  - Đa dạng chế độ sắp xếp: xếp theo hạn chót, theo độ ưu tiên hoặc theo ngày tạo.
  - Thẻ công việc chi tiết: hỗ trợ mô tả, đính kèm tệp/hình ảnh, danh sách việc phụ (checklist).
  - Lên lịch trực tiếp: Gán ngày làm việc cho một đầu việc trong kho để đưa việc đó xuất hiện ngay trên bàn làm việc Daily Task Management.

#### 4. Events (Sự kiện & Lịch thi cử)
- **Cảm hứng & Vibe UI:** Chủ đề Rừng xanh (Forest, cây cối, lá cỏ thiên nhiên, tông xanh lá dịu mát, an lành).
- **Tính năng & Cách hoạt động:**
  - Quản lý các sự kiện trường học (online/offline), lịch họp mặt, và đặc biệt là Lịch thi cử (được xem là vùng ưu tiên cao nhất, có khu vực làm nổi bật riêng).
  - Phân biệt rõ 2 loại sự kiện bằng màu sắc và biểu tượng riêng:
    1. *Sự kiện thực tế:* Cuộc họp, buổi hẹn, sự kiện diễn ra vào giờ cụ thể.
    2. *Hạn chót (Deadline):* Hạn nộp bài, thời hạn cuối cần hoàn thành.
  - Thống kê đầu trang: Tổng số sự kiện, các sự kiện trong tuần này, đồng hồ đếm ngược đến ngày thi gần nhất.
  - Các thẻ sự kiện: Hiển thị tên sự kiện, thời gian, địa điểm, thời gian còn lại (còn bao nhiêu ngày/giờ). Nhấp vào thẻ sẽ mở cửa sổ pop-up ngay giữa màn hình để xem/sửa ghi chú chi tiết (hỗ trợ phím tắt `Esc` để đóng nhanh).
  - Lịch tích hợp: Dễ dàng chuyển đổi giữa chế độ xem Tuần và xem Tháng.

#### 5. In Progress Projects (Dự án đang triển khai)
- **Cảm hứng & Vibe UI:** Chủ đề Khoa học máy tính, Công nghệ, Kỹ sư, Lập trình và Gaming (hiện đại, mạch lạc, tinh tế).
- **Tính năng & Cách hoạt động:**
  - Theo dõi bức tranh tổng quan của các dự án phần mềm và sáng tạo cá nhân (như Go Game, Hiep Trong Space,...).
  - Mỗi dự án có một thẻ tổng quan bao gồm: Tên dự án, hạn chót hoàn thành kèm thời gian tương đối, tiến độ thực tế do người dùng tự đánh giá, mô tả chi tiết, những bài toán hóc búa / khó khăn hiện tại cần giải quyết, và các bước tiếp theo.

#### 6. Annual Milestones (Cột mốc & Mục tiêu năm)
- **Cảm hứng & Vibe UI:** Chủ đề Chinh phục đỉnh núi (Summit), tầm nhìn xa, khát vọng bền bỉ.
- **Tính năng & Cách hoạt động:**
  - Nơi đặt ra và theo dõi các mục tiêu lớn trong năm, danh sách những điều muốn trải nghiệm trong đời (bucket list).
  - Đo lường mức độ hoàn thành từng mục tiêu theo quý và năm.
  - Khu vực viết nhật ký tổng kết, tự đánh giá và suy ngẫm sau mỗi chặng đường.

#### 7. APCS Hub (Không gian học tập Đại học)
- **Cảm hứng & Vibe UI:** Chủ đề Đại dương xanh, bầu trời cao rộng (Sea, Blue, Sky) — cảm giác thoáng đãng, trong lành, truyền cảm hứng nghiên cứu.
- **Tính năng & Cách hoạt động:**
  - Không gian học tập riêng cho chương trình Tiên tiến Khoa học Máy tính (APCS).
  - Lưu trữ, sắp xếp tài liệu học tập, slide bài giảng, bài tập lớn trực quan theo từng Năm học và Học kỳ (Năm 1, Năm 2, Năm 3, Năm 4).
  - Giao diện tra cứu tài liệu nhanh gọn, đẹp mắt hơn việc duyệt thư mục tệp thông thường.

#### 8. Learning Room (Phòng tự học tập trung)
- **Cảm hứng & Vibe UI:** Căn phòng ấm cúng, tĩnh lặng (Cozy Focus Room), ánh đèn bàn dịu mắt, mang lại cảm giác muốn ngồi vào bàn học tập trung sâu.
- **Tính năng & Cách hoạt động:**
  - Đồng hồ Pomodoro hoặc bộ đếm giờ tự học với các khoảng nghỉ hợp lý.
  - Tích hợp không gian âm thanh nhẹ nhàng (nhạc lofi, âm thanh thiên nhiên) giúp gia tăng độ tập trung.
  - Bảng thống kê học tập trực quan: Đo lường tổng thời gian học, thời gian tập trung thực sự, thời gian nghỉ ngơi thông qua các biểu đồ đơn giản, đẹp mắt.

---

### NHÓM TÍNH NĂNG MỞ RỘNG (SECONDARY)

#### 9. Tracking (Đo lường & Nhật ký thói quen)
- **Cảm hứng & Vibe UI:** Phong cách Tối giản & Văn hóa Nhật Bản (Zen, mực đen, giấy mộc, mộc mạc và chuẩn mực).
- **Tính năng & Cách hoạt động:**
  - *Thói quen hàng ngày (Daily Habits):* Đánh dấu các thói quen cần rèn luyện mỗi ngày và đếm chuỗi ngày duy trì liên tục (streak).
  - *Theo dõi giấc ngủ (Sleep Tracking):* Công cụ tính toán chu kỳ ngủ lý tưởng và nhật ký ghi nhận số giờ ngủ mỗi đêm.
  - *Thời gian dùng màn hình (Screen Time):* Nhập thời lượng dùng máy tính/điện thoại, phân tích biểu đồ thói quen và xu hướng sử dụng thiết bị để duy trì lối sống lành mạnh.

#### 10. AI Engineering (Không gian học nghề AI)
- **Cảm hứng & Vibe UI:** Bản vẽ kỹ thuật số, mạng nơ-ron (Neural lattice), sắc nét, đậm chất công nghệ tương lai.
- **Tính năng & Cách hoạt động:**
  - Bàn làm việc chuyên biệt cho hành trình phát triển nghề nghiệp trở thành Kỹ sư Trí tuệ Nhân tạo (AI Engineer).
  - Lộ trình học tập chi tiết (Roadmap) từ nền tảng đến nâng cao.
  - Không gian lưu trữ ghi chú nghiên cứu, các bài báo hay, thử nghiệm mô hình, có khả năng nhập (import) các ghi chú học tập từ Notion vào website.

#### 11. Blogs Hub (Góc viết lách & Tản văn)
- **Cảm hứng & Vibe UI:** Chủ đề Gỗ trầm, Cây cỏ và Giấy mộc (Wood & Manuscript) — toát lên vẻ khiêm tốn, trầm tĩnh, sâu lắng của một người trưởng thành.
- **Tính năng & Cách hoạt động:**
  - Nơi tự do viết lách tản văn, các bài tiểu luận suy ngẫm cá nhân (hỗ trợ cả chế độ viết nháp và chế độ hoàn chỉnh). Ví dụ các chủ đề: "Hiệu ứng Domino của sự trì hoãn", "Bộ não con người có thể tập trung sâu trong bao lâu?".
  - Không gian viết yên tĩnh kết hợp âm nhạc êm ái, nhẹ nhàng.
  - Trình soạn thảo văn bản cơ bản, sạch sẽ như Notion (tập trung vào con chữ, không cần công thức toán hay code phức tạp).
  - Hiển thị tên tác giả bài viết (giúp lưu giữ cả những bài viết tâm đắc được sưu tầm từ người khác).

#### 12. Flashcards (Bộ thẻ ghi nhớ kiến thức)
- **Cảm hứng & Vibe UI:** Phong cách Cổ điển châu Âu, tinh thần chiến binh Viking / Lịch sử cổ đại (trầm mặc, bí ẩn, kích thích khám phá).
- **Tính năng & Cách hoạt động:**
  - Hệ thống thẻ ghi nhớ học từ vựng tiếng Anh và các khái niệm quan trọng theo phương pháp lặp lại ngắt quãng.
  - Phân loại thẻ theo nhiều chủ đề, nhóm bài học khác nhau.
  - Cho phép người dùng trực tiếp gõ đáp án để rèn luyện trí nhớ (tham khảo ý tưởng thao tác nhanh của Brainscape).
  - Phím tắt tiện lợi (như `Ctrl+S` để lưu ngay khi gõ xong thẻ mới).

#### 13. Personal Achievements (Phòng truyền thống & Thành tích)
- **Cảm hứng & Vibe UI:** Đỉnh vinh quang (Zenith, trang trọng, tự hào nhưng khiêm tốn).
- **Tính năng & Cách hoạt động:**
  - Nơi lưu giữ hành trình các cuộc thi đã tham gia, kết quả đạt được qua từng cấp học (từ Tiểu học đến Đại học).
  - Không gian ghi lại những bài học kinh nghiệm quý giá rút ra sau mỗi cuộc thi.
  - Hai chế độ linh hoạt:
    1. *Chế độ Trưng bày (Showcase):* Như một trang portfolio cá nhân đẹp mắt để nhìn lại hành trình trưởng thành.
    2. *Chế độ Quản trị (Admin Mode):* Cho phép thêm mới, sắp xếp và chỉnh sửa thông tin thành tích.

#### 14. Entertainment Hub (Góc giải trí & Nghỉ ngơi)
- **Cảm hứng & Vibe UI:** Phòng chờ thư giãn, sóng âm du dương, giải tỏa áp lực.
- **Tính năng & Cách hoạt động:**
  - *Music Hub:* Tích hợp nghe các danh sách phát nhạc yêu thích (như YouTube Music) để thư giãn khi làm việc.
  - *Library (Tủ sách):* Danh sách theo dõi những cuốn sách đang đọc, đã đọc, kèm trích dẫn tâm đắc.
  - *Game Backlog:* Ghi lại những tựa game hay dự định thưởng thức vào thời gian rảnh rỗi.

---

## 5. Lời dặn dò dành cho AI Agent khi tiến hành xây dựng lại từ đầu

1. **Khởi đầu tinh gọn & kiểm soát tuyệt đối:** 
   - Đừng cố gắng mang theo những mớ bòng bong, những file code vá víu hay cấu trúc phụ thuộc phức tạp của bản cũ.
   - Hãy dựng bộ khung từ những điều cơ bản nhất, viết code rõ ràng, module hóa sạch sẽ để chủ dự án luôn nắm quyền kiểm soát mã nguồn.
2. **Ưu tiên cảm xúc thị giác & sự mượt mà:**
   - Một giao diện đẹp không phải là giao diện nhồi nhét thật nhiều hình vẽ SVG hay hiệu ứng màu mè rực rỡ.
   - Cái đẹp nằm ở sự mềm dịu của bảng màu, sự tinh tế của khoảng cách (spacing), sự thanh nhã của font chữ và độ mượt mà tự nhiên của từng chuyển động.
3. **Lắng nghe và xác nhận:**
   - Xây dựng từng tính năng theo đúng mức độ ưu tiên đã vạch ra (bắt đầu từ Homepage, Daily Task, Tasks Hub, Events...).
   - Nếu gặp bất kỳ điểm nào chưa rõ ràng về trải nghiệm hay giao diện, hãy chủ động thảo luận cùng người dùng thay vì tự ý suy diễn phức tạp hóa vấn đề.

