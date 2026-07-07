# VERCEL.md — Vercel 배포 가이드

**권장 구성:** Vercel(앱) + 자체 PostgreSQL(DB)  
**URL:** 우선 `https://xxxx.vercel.app` (커스텀 도메인은 나중에)  
**GitHub:** [ALL4UITeam/project-manager](https://github.com/ALL4UITeam/project-manager)

UCS Tomcat 서버 디스크가 부족할 때 이 방식을 씁니다. UCS(`/ucs/`)는 그대로 두고, 이 앱만 Vercel에 올립니다.

---

## 아키텍처

```
[브라우저]
    │
    ├─ https://ucs.all4land.com/ucs/     → 기존 UCS (Tomcat, 그대로)
    │
    └─ https://project-manager-xxx.vercel.app/  → Vercel (이 프로젝트)
              │
              └── Prisma ──▶ PostgreSQL 175.198.62.178:11992 / ucsdb.work
```

| 항목 | 위치 |
|------|------|
| 화면 + API | Vercel Serverless |
| DB | 자체 서버 PostgreSQL (이미 `work` 스키마 생성됨) |
| UCS 서버 디스크 | **거의 안 씀** |

---

## Push 전 체크리스트

배포 전에 아래를 확인하세요.

### 코드·빌드

- [ ] 로컬에서 `npm run build` 성공
- [ ] `.env` 파일이 **git에 안 올라감** (`.gitignore`에 포함됨)
- [ ] `.env.example`만 커밋 (비밀번호 없음)
- [ ] `prisma/schema.prisma` 포함됨
- [ ] `src/app/api/` API Route 포함됨

### DB (이미 한 번 했으면 스킵)

- [ ] DB 이름: **`ucsdb`** (uscdb 아님)
- [ ] 스키마: **`work`**
- [ ] 테이블 존재 (pgAdmin 또는 `npm run db:studio`)
- [ ] 시드 데이터 필요 시: 로컬에서 `npm run db:seed` (Vercel에서 실행 안 함)

### Vercel용 설정 주의

- [ ] Vercel 환경변수에 **`BASE_PATH` 넣지 않음** (`xxx.vercel.app` 루트 배포)
- [ ] Vercel에 **`DATABASE_URL`만** 필수로 설정
- [ ] DB **11992 포트** 외부 접속 허용됨 (확인 완료)

### GitHub

- [ ] remote: `https://github.com/ALL4UITeam/project-manager.git`
- [ ] `main` 브랜치에 **최신 코드 push** 완료
- [ ] GitHub Pages workflow **삭제됨** (`.github/workflows/deploy-pages.yml` 없음)

### 커밋 전 확인 명령 (로컬)

```bash
git status
npm run build
# .env 가 staged 에 없는지
git status | findstr ".env"
```

---

## 1단계: GitHub에 push

### 최초 또는 변경사항 반영

```bash
cd c:\Users\test\Desktop\github\all4land\work

git add .
git status
# .env 가 목록에 없어야 함

git commit -m "feat: PostgreSQL 연동 및 Vercel 배포 준비"
git push origin main
```

### 이후 업데이트

```bash
git add .
git commit -m "설명"
git push origin main
```

→ Vercel 연동 후에는 **`main`에 push할 때마다 자동 재배포**됩니다.

---

## 2단계: Vercel 프로젝트 연결 (최초 1회)

### 2-1. 로그인

1. [https://vercel.com](https://vercel.com) 접속
2. **Continue with GitHub** 로 로그인
3. GitHub 권한 허용 (ALL4UITeam 조직/repo 접근)

### 2-2. 프로젝트 Import

1. Vercel 대시보드 → **Add New…** → **Project**
2. **Import Git Repository** → `ALL4UITeam/project-manager` 선택  
   - 안 보이면 **Adjust GitHub App Permissions** 에서 repo 접근 허용
3. **Configure Project** 화면에서:

| 설정 | 값 |
|------|-----|
| Framework Preset | **Next.js** (자동) |
| Root Directory | `./` (기본) |
| Build Command | `npm run build` (기본, prisma generate 포함) |
| Output Directory | (비움 — Next.js 기본) |
| Install Command | `npm install` (기본) |

### 2-3. Environment Variables (필수)

**Deploy** 누르기 **전에** 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://ucs:비밀번호@175.198.62.178:11992/ucsdb?schema=work` | Production, Preview, Development |

**넣지 말 것 (Vercel 기본 URL 사용 시):**

- `BASE_PATH`
- `NEXT_PUBLIC_BASE_PATH`
- `PORT`

> `!` 같은 특수문자가 비밀번호에 있으면 URL 그대로 붙여넣기 (Vercel UI는 OK).

### 2-4. Deploy

**Deploy** 클릭 → 2~5분 대기.

성공 시 URL 예:

```
https://project-manager-xxxxx.vercel.app/
```

---

## 3단계: 자동 배포 (GitHub 연동)

최초 Import 시 **자동으로 켜짐.**

| 이벤트 | 결과 |
|--------|------|
| `main` 브랜치 push | **Production** 자동 배포 |
| 다른 브랜치 push / PR | **Preview** URL 생성 (선택) |

### 확인 경로

Vercel 대시보드 → 프로젝트 → **Deployments** 탭  
GitHub repo → **Actions** (Vercel이 GitHub App으로 연동, 별도 workflow 파일 불필요)

### 수동 재배포

Deployments → 최신 배포 → **⋯** → **Redeploy**

---

## 4단계: 동작 확인

배포 URL에서:

1. 로그인 화면 로드
2. `master@all4land.com` / `master123` 로그인
3. 프로젝트 목록 표시
4. 프로젝트 추가 → pgAdmin `work.projects`에 row 생기는지 확인

### API 직접 테스트

```bash
curl "https://YOUR-PROJECT.vercel.app/api/data/"
```

JSON에 `users`, `projects` 배열이 보이면 DB 연결 OK.

---

## 환경별 설정 정리

| 환경 | URL | BASE_PATH | DATABASE_URL |
|------|-----|-----------|--------------|
| 로컬 dev | `localhost:3000` | 없음 | `.env` (원격 DB 가능) |
| **Vercel** | `xxx.vercel.app` | **없음** | Vercel 대시보드 |
| UCS 서버 `/pm/` | `ucs.all4land.com/pm/` | `/pm` | 서버 `.env` → [SERVE.md](SERVE.md) |

---

## 로컬 vs Vercel

| 작업 | 어디서 |
|------|--------|
| `npm run dev` | 로컬 개발 |
| `npm run db:push` | 로컬 (스키마 변경 시) |
| `npm run db:seed` | 로컬 (초기 데이터) |
| `npm run build` | Vercel이 자동 실행 |
| 앱 실행 | Vercel (PM2 불필요) |

---

## 커스텀 도메인 (나중에)

Vercel → Project → **Settings** → **Domains**

예: `pm.all4land.com` 추가 → DNS에 CNAME 안내 따름.

`ucs.all4land.com/pm/` 은 Apache 리다이렉트로 Vercel URL 넘기는 방법도 가능 (SERVE.md 참고).

---

## 문제 해결

| 증상 | 원인 / 해결 |
|------|-------------|
| Build Failed `prisma` | `package.json`에 `postinstall: prisma generate` 확인 (이미 있음) |
| **DB 연결 실패** / 500 on `/api/data` | Vercel `DATABASE_URL` 확인, DB 방화벽 11992, DB명 `ucsdb` |
| 로그인 안 됨 | seed 안 됐으면 `npm run db:seed` 로컬 실행 |
| CSS/JS 404 | Vercel에 `BASE_PATH` 넣었는지 확인 → **제거** |
| 308 redirect | URL 끝 `/` 붙이기 (`trailingSlash: true`) |
| 이전 static 사이트 나옴 | GitHub에 **최신 코드 push** 안 됨 |
| `too many connections` | 트래픽 증가 시 PgBouncer 또는 Prisma Accelerate 검토 |

### Vercel 로그 보기

Vercel → Project → **Deployments** → 실패한 배포 클릭 → **Build Logs** / **Functions** 탭

---

## 보안 참고

- `DATABASE_URL`은 **Vercel Environment Variables**에만 저장 (Git 커밋 금지)
- DB가 인터넷에 열려 있으면 IP 제한·강한 비밀번호 권장
- Preview 배포도 같은 DB 쓰면 테스트 데이터 섞일 수 있음 → 팀 정책에 따라 Preview용 DB 분리 검토

---

## 빠른 요약 (처음 한 번)

```text
1. npm run build          (로컬 확인)
2. git push origin main   (GitHub)
3. vercel.com → Import project-manager
4. DATABASE_URL 추가
5. Deploy
6. xxx.vercel.app 로그인 테스트
```

이후: **코드 수정 → git push → Vercel 자동 배포**

---

## 관련 문서

- [SERVE.md](SERVE.md) — UCS 서버에 직접 올릴 때 (`/pm/`, Apache, PM2). 디스크 여유 없으면 **이 문서 대신 VERCEL.md 사용**
- [README.md](README.md) — 프로젝트 개요
