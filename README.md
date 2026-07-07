# project-manager

All4Land **프로젝트 현황 & 주간 업무 보고** UI 프로토타입 (Next.js)

## 로컬 실행

```bash
npm install
npm run dev
```

## 배포

| 방식 | 문서 | URL |
|------|------|-----|
| **Vercel (권장)** | [**VERCEL.md**](VERCEL.md) | `https://xxxx.vercel.app` |
| UCS 서버 직접 | [SERVE.md](SERVE.md) | `https://ucs.all4land.com/pm/` |

## 데모 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| Master | master@all4land.com | master123 |
| 팀장 | ilho@all4land.com | lead123 |
| 팀원(기획) | changi@all4land.com | member123 |
| 팀원(퍼블) | seungjun@all4land.com | member123 |

## 공유 링크 예시

로컬: `http://localhost:3000/share/meetings/?token=...`  
서버: `https://your-domain/share/meetings/?token=...`

---

## 라우트 구조

Next.js App Router 기준. `(dashboard)`는 **Route Group**으로, 괄호 이름은 URL에 포함되지 않습니다.

```
src/app/
├── layout.tsx              # 루트 레이아웃 (폰트, AppProvider)
├── page.tsx                # / → 로그인 또는 /projects 리다이렉트
├── login/page.tsx          # /login (사이드바 없음)
├── (dashboard)/            # 인증 + 사이드바 레이아웃 그룹
│   ├── layout.tsx          # AuthGuard → DashboardLayout
│   ├── projects/page.tsx   # /projects
│   ├── reports/page.tsx    # /reports
│   ├── calendar/page.tsx   # /calendar
│   ├── md/page.tsx         # /md
│   ├── meetings/page.tsx   # /meetings
│   ├── accounts/page.tsx   # /accounts
│   ├── dashboard/page.tsx  # /dashboard (→ projects 별칭)
│   └── mm/page.tsx         # /mm (→ md 별칭)
└── share/meetings/[token]/ # /share/meetings/:token (공개, 인증 없음)
```

| 경로 | 레이아웃 | 설명 |
|------|----------|------|
| `/`, `/login` | 루트만 | 로그인 화면 |
| `/projects` … `/accounts` | AuthGuard + 사이드바 | 역할별 메뉴 접근 제어 |
| `/share/meetings/:token` | 루트만 | 링크 공유 회의록 (인증 불필요) |

## 메뉴별 역할

| 메뉴 | 경로 | 역할 |
|------|------|------|
| 프로젝트 현황 | `/projects` | 프로젝트 CRUD, 파트별 산출물 링크 관리 |
| 주간 업무 보고 | `/reports` | 주간 업무·이슈·비고 등록 (핵심 입력 화면) |
| 일정 관리 | `/calendar` | 마일스톤·일정 캘린더 + **프로젝트 WBS 간트 일정표** |
| M/D 현황 | `/md` | 주간 업무 기반 Man-Day 공수 집계 |
| 회의록 | `/meetings` | 회의록 작성·링크 공유 |
| 계정 관리 | `/accounts` | 사용자·역할·파트 관리 (Master·팀장) |

### 역할별 메뉴 접근

| 역할 | 접근 가능 메뉴 |
|------|----------------|
| MASTER | 전체 |
| LEADER | 전체 |
| MEMBER | accounts(계정 관리) 제외 — 그 외 메뉴·편집 전체 |
| EXTERNAL | calendar만 |

## 데이터 출처

**PostgreSQL** (`ucsdb` / `work` 스키마) + **Prisma** + Next.js API Route.

| 데이터 | API / 테이블 | 등록·수정 위치 |
|--------|---------------|----------------|
| 프로젝트 | `projects` | 프로젝트 현황 |
| 주간 업무 / M·D / 투입 멤버 | `weeklyTasks` | 주간 업무 보고 |
| 이슈 | `projectIssues` | 주간 업무 보고 → 이번 주 이슈 |
| 비고 | `projectRemarks` | 주간 업무 보고 → 비고 |
| 산출물 링크 | `projectResourceLinks` | 프로젝트 상세 (파트별) |
| 회의록 | `meetingNotes` | 회의록 |
| 마일스톤 | `milestones` | 일정 관리 → 캘린더 |
| WBS 일정 행 | `scheduleRows` | 일정 관리 → 프로젝트 일정표 (프로젝트별·연도별) |
| 사용자 | `users` | 계정 관리 |

주간 업무 보고가 **단일 원천**인 영역(주간 업무, 이슈, 비고, M/D 집계)과, 별도 화면에서 관리하는 영역(프로젝트 메타, 산출물 링크, 회의록)으로 나뉩니다.

## 스택

- Next.js 16 (App Router), Tailwind CSS, shadcn/ui, Recharts
- PostgreSQL + Prisma
- 서버 실행: `npm run build` → `npm run start`
