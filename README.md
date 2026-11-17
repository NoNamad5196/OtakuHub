# OtakuHub

**OtakuS** 플랫폼의 이벤트·일정 관리 모듈입니다.
공개 커뮤니티 게시글(네이버 라운지, 디시인사이드, 공식 사이트)을 수집해 Gemini(또는 로컬 휴리스틱 폴백)로 구조화된 일정 후보를 추출하고, 검수·승인을 거친 일정을 캘린더, 리마인더, 굿즈 컬렉션으로 관리합니다.

## 기술 스택

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4, FullCalendar, dayjs
- **Firebase Google Auth (HttpOnly 세션 쿠키) + Cloud Firestore (`firebase-admin`)**
  - `SipSungJang`, `GachaGuard`와 동일한 Firebase 프로젝트 및 `users/{uid}` 계정을 공유합니다.
  - Spark 무료 요금제 기준이며 Cloud Functions나 Blaze 유료 확장은 사용하지 않습니다.
- Axios/Cheerio 크롤러 및 Playwright 공식 사이트 어댑터
- Gemini Developer API (`GEMINI_API_KEY` 미설정 시 로컬 휴리스틱 추출기로 동작)

## 로컬 실행

Node 24와 Java 21(Firebase 에뮬레이터 실행용)을 사용합니다.

```sh
npm ci
npm run dev
```

Firebase나 Gemini 환경 변수가 없으면 **읽기 전용/로컬 데모 모드**로 실행됩니다.
실제 연동 설정은 `.env.example`을 참고해 로컬 `.env.local`에 작성합니다.

## 인증과 데이터 경계

- 브라우저는 Google 로그인 후 서버 세션 라우트에서 ID 토큰을 검증해 HttpOnly 세션 쿠키를 발급받습니다.
- 모든 서버 읽기/쓰기의 UID는 검증된 세션에서만 유도하며, 클라이언트가 개인 모듈 경로에 직접 쓰지 않습니다.
- 크롤링 원문과 미승인 후보는 서버 전용(`modules/hub/*`)으로 관리하고, 검수를 통과한 일정만 공개 `events/{eventId}`에 게시합니다.
- 권위 계약은 `SipSungJang` 저장소의 `docs/otakus-firestore-contract.md`(OtakuS Firestore Contract v1)입니다. 이 저장소의 `firestore.rules`와 `firestore.indexes.json`은 로컬 에뮬레이터 검증용 스냅샷입니다.

## 데이터 경로

`H = users/{uid}/hub/main`이며 네임스페이스 `hub/main` 문서 자체는 생성하지 않습니다.

| 기존 Supabase 테이블 / 구분 | Cloud Firestore 경로 |
| --- | --- |
| `profiles` | `users/{uid}` (`profile`, 서버 관리 `account`) |
| `franchises`, `games` | `franchises/{id}`, `games/{gameId}` |
| `events` (검수·승인된 공개 일정) | `events/{eventId}` |
| `user_franchises` | `users/{uid}/userFranchises/{franchiseId}` |
| `user_events` | `users/{uid}/hub/main/userEvents/{eventId}` |
| `collections` | `users/{uid}/hub/main/collections/{id}` |
| `reminders` | `users/{uid}/hub/main/reminders/{id}` |
| `crawl_sources` | `modules/hub/crawlSources/{id}` |
| `crawled_posts` | `modules/hub/crawledPosts/{postId}` |
| `event_suggestions` | `modules/hub/eventSuggestions/{suggestionId}` |
| `crawl_runs` | `modules/hub/crawlRuns/{id}` |
| Agent 연동 신호 | `users/{uid}/agentSignals/{signalId}` |

기존 `supabase/` 폴더의 SQL 및 시드 파일은 **역사적 참고 자료**이며 런타임이나 설치 절차에서 실행하지 않습니다.
검증된 매핑 기반의 1회성 데이터 이관은 `scripts/migrate-from-supabase.mjs`(`npm run test:migration`으로 검증)에서 처리합니다.

## OtakuS 서비스 런처

사이드바와 설정 화면에 OtakuS 형제 서비스(`SipSungJang`, `GachaGuard`)로 이동하는 통합 런처(`AppLauncher`)가 포함되어 있습니다.

- `NEXT_PUBLIC_SIPSUNGJANG_URL`: SipSungJang 배포 주소
- `NEXT_PUBLIC_GACHAGUARD_URL`: GachaGuard 배포 주소

환경 변수에 유효한 HTTPS URL을 설정하면 사이드바 및 설정 화면의 런처 링크가 활성화되며, 미설정 시 **연결 준비 중**으로 표시됩니다.

## 크롤링 및 Cron

`vercel.json`은 매일 `0 18 * * *` UTC에 `GET /api/crawl/run`을 호출하도록 설정되어 있습니다. 운영 환경에서는 `Authorization: Bearer $CRON_SECRET` 헤더로 보호되며, 탐색(Discover) 화면에서는 `POST /api/crawl/run`으로 수동 실행할 수 있습니다.

## 검증

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run test:emulator
npm run build
```

`npm run test:emulator`는 `demo-otakus` 프로젝트로 Firestore/Auth 로컬 에뮬레이터를 띄워 보안 규칙과 서버 통합 테스트를 수행합니다. 실제 Firebase 프로젝트 자격 증명은 필요하지 않습니다.
