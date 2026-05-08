insert into public.franchises (id, name, slug, category, color_code, is_public)
values
  ('11111111-1111-4111-8111-111111111111', '블루 아카이브', 'blue-archive', 'game', '#38bdf8', true),
  ('22222222-2222-4222-8222-222222222222', '프로젝트 세카이', 'project-sekai', 'game', '#f472b6', true),
  ('33333333-3333-4333-8333-333333333333', '홀로라이브', 'hololive', 'vtuber', '#34d399', true)
on conflict (slug) do nothing;

insert into public.events (franchise_id, type, title, start_date, end_date, location, source_url, is_verified)
values
  ('11111111-1111-4111-8111-111111111111', 'cafe', '블루 아카이브 콜라보 카페 2차 예약 오픈', current_date + interval '1 day', current_date + interval '21 day', '서울 홍대', 'https://example.com/blue-archive-cafe', true),
  ('22222222-2222-4222-8222-222222222222', 'preorder', '프로젝트 세카이 신상 아크릴 스탠드 예약 시작', current_date + interval '3 day', null, '온라인', 'https://example.com/project-sekai-goods', true),
  ('33333333-3333-4333-8333-333333333333', 'broadcast', '홀로라이브 한국어 공식 방송', current_date + interval '6 day', null, null, 'https://example.com/hololive-stream', true);

insert into public.crawl_sources (franchise_id, source_type, name, url, keywords, is_active)
values
  ('11111111-1111-4111-8111-111111111111', 'naver_lounge', '네이버 라운지 공지', 'https://example.com/naver-lounge', array['콜라보', '카페', '예약', '굿즈'], true),
  ('22222222-2222-4222-8222-222222222222', 'dc', 'DC 프로젝트 세카이 갤러리', 'https://example.com/dc-gallery', array['발매', '예약', '팝업'], true),
  ('33333333-3333-4333-8333-333333333333', 'official', '공식 소식 페이지', 'https://example.com/official-news', array['방송', '이벤트', '콘서트'], true);
