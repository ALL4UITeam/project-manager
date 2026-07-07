# SERVE.md — UCS 서버 직접 배포 가이드

> **디스크/용량 부족 시:** [VERCEL.md](VERCEL.md) 로 Vercel + 동일 DB 구성을 권장합니다.

**목표 URL:** [https://ucs.all4land.com/pm/](https://ucs.all4land.com/pm/)

프로젝트 현황 & 주간 업무 보고 (Next.js + PostgreSQL)

---

## 1. 지금 서버에 뭐가 있는지

```
                    https://ucs.all4land.com
                              │
                    ┌─────────┴─────────┐
                    │   Apache (httpd)   │  ← 443 HTTPS / 80 HTTP
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    /ucs/*              /pm/* (신규)              /
  Tomcat:8080         Node:3000            /var/www/html/
  기존 UCS Java       project-manager      Oracle 테스트 페이지
  index.do 등
```

| URL | 설명 |
|-----|------|
| `https://ucs.all4land.com/ucs/index.do` | **기존 UCS** (Java/Tomcat) — **유지, 삭제 금지** |
| `https://ucs.all4land.com/pm/` | **이 프로젝트** (Node/Next.js) — 새로 붙일 주소 |
| `https://ucs.all4land.com/` | Apache 기본 페이지 (루트에 앱 없음) |

**Tomcat은 UCS 때문에 반드시 살려둡니다.**
Tomcat `webapps/`에 WAR 넣는 방식이 **UCS용**이고, **이 Next.js 앱은 webapps에 넣지 않습니다.**

---

## 2. 포트 정리 (헷갈리는 부분)

| 포트 | 역할 | 브라우저에서 |
|------|------|-------------|
| **443** | HTTPS (Apache) | `https://ucs.all4land.com/pm/` |
| **3000** | Next.js 앱 (PM2) | 서버 내부용. Apache가 `/pm/`을 여기로 넘김 |
| **8080** | Tomcat (UCS `/ucs/`) | 직접 접속 안 함 |
| **11992** | PostgreSQL | 앱만 `.env`로 접속 |
| **22022** | SSH | `ssh ucs@175.198.62.178 -p 22022` |

- **DB 11992** = 데이터 창고. URL에 안 보임.
- **앱 3000** = Node 프로그램이 듣는 포트. 사용자는 **`/pm/`** 으로만 접속.
- **80/443** = Apache가 받아서 `/ucs/` → Tomcat, `/pm/` → Node 로 나눔.

---

## 3. 이 프로젝트 배포 구조

1. 코드 위치: `/home/abs/was/project-manager` (Tomcat 폴더와 **별도**)
2. `npm run build` → `pm2 start` → **3000** 포트
3. Apache에 **`/pm/` → `http://127.0.0.1:3000/pm/`** 프록시 추가
4. Next.js **`BASE_PATH=/pm`** 빌드 (이미 코드에 반영됨)

로컬 개발(`npm run dev`)은 `BASE_PATH` 없이 `http://localhost:3000/`
서버 빌드는 `.env`에 `BASE_PATH=/pm` 필수.

---

## 4. 서버 접속

로컬 PC에서:

```bash
ssh ucs@175.198.62.178 -p 22022
```

---

## 5. Node.js 20 설치 (최초 1회)

배포판 확인:

```bash
cat /etc/os-release
```

### Oracle Linux / RHEL / Rocky / CentOS

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
node -v   # v20.x
npm -v
```

### Ubuntu / Debian (해당 시)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

---

## 6. PM2 설치 (최초 1회)

```bash
sudo npm install -g pm2
pm2 -v
```

---

## 7. 프로젝트 배치

```bash
sudo mkdir -p /home/abs/was/project-manager
sudo chown -R $USER:$USER /home/abs/was/project-manager
cd /home/abs/was/project-manager

# Git (레포 URL로 교체)
git clone https://github.com/YOUR_ORG/YOUR_REPO.git .
git pull
```

로컬에서 업로드할 때 (Windows PowerShell 예):

```powershell
scp -P 22022 -r C:\Users\test\Desktop\github\all4land\work\* ucs@175.198.62.178:/home/abs/was/project-manager/
```

---

## 8. 서버 `.env` 설정

```bash
cd /home/abs/was/project-manager
nano .env
```

**서버용 예시 (그대로 복사 후 비밀번호만 확인):**

```env
DATABASE_URL="postgresql://ucs:!all4land!@175.198.62.178:11992/ucsdb?schema=work"

BASE_PATH=/pm
NEXT_PUBLIC_BASE_PATH=/pm

PORT=3000
NODE_ENV=production
```

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL `ucsdb`, 스키마 `work` |
| `BASE_PATH` | 빌드 시 `/pm` prefix (필수) |
| `PORT` | Node listen 포트 |

저장: `Ctrl+O` → Enter → `Ctrl+X`

---

## 9. 빌드 & PM2 실행

```bash
cd /home/abs/was/project-manager
npm install
npm run build
pm2 start npm --name "project-manager" -- start
pm2 save
pm2 status
```

로그:

```bash
pm2 logs project-manager --lines 50
```

서버 **내부** 테스트:

```bash
curl -s http://127.0.0.1:3000/pm/api/data/ | head -c 300
```

JSON(`users`, `projects` 등)이 보이면 OK.

재부팅 후 자동 시작:

```bash
pm2 startup
# 출력되는 sudo ... 명령 한 줄 실행
pm2 save
```

---

## 10. Apache(httpd) — `/pm/` 연결

UCS 서버는 **Apache(httpd)** 가 앞단입니다. Oracle Linux Test Page도 Apache 기본 페이지입니다.

### 10-1. 필요 모듈

```bash
sudo yum install -y mod_ssl
# proxy 모듈 확인
httpd -M | grep proxy
# proxy proxy_http 없으면:
sudo yum install -y httpd
```

### 10-2. 설정 파일 추가

```bash
sudo nano /etc/httpd/conf.d/project-manager.conf
```

**HTTPS VirtualHost 안에 넣거나**, 별도 파일로:

```apache
# project-manager — Next.js @ /pm/
<Location /pm/>
    ProxyPass http://127.0.0.1:3000/pm/
    ProxyPassReverse http://127.0.0.1:3000/pm/
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Host "ucs.all4land.com"
</Location>
```

또는 VirtualHost 블록 안에:

```apache
<VirtualHost *:443>
    ServerName ucs.all4land.com
    # ... 기존 SSL 설정 ...

    # 기존 /ucs/ → Tomcat 설정은 그대로 두기

    ProxyPreserveHost On
    ProxyPass        /pm/  http://127.0.0.1:3000/pm/
    ProxyPassReverse /pm/  http://127.0.0.1:3000/pm/
</VirtualHost>
```

> ⚠️ **기존 `/ucs/` Tomcat 프록시 설정은 건드리지 마세요.**

### 10-3. 적용

```bash
sudo apachectl configtest
sudo systemctl restart httpd
sudo systemctl status httpd
```

### 10-4. 브라우저 확인

- [https://ucs.all4land.com/pm/](https://ucs.all4land.com/pm/) → 로그인 화면
- [https://ucs.all4land.com/ucs/index.do](https://ucs.all4land.com/ucs/index.do) → 기존 UCS 그대로

---

## 11. 코드 업데이트 (배포 반복)

```bash
cd /home/abs/was/project-manager
git pull
npm install
npm run build
pm2 restart project-manager
```

DB 스키마 변경 시:

```bash
npm run db:push
```

초기 mock 데이터 재입력 (주의: work 스키마 데이터 삭제 후 재삽입):

```bash
npm run db:seed
```

---

## 12. 로컬 vs 서버

| | 로컬 개발 | 서버 |
|--|----------|------|
| 명령 | `npm run dev` | `npm run build` → `pm2 start` |
| URL | `http://localhost:3000/` | `https://ucs.all4land.com/pm/` |
| `BASE_PATH` | 비움 (`.env`에 없음) | `/pm` |
| DB | `.env` DATABASE_URL (원격 DB 가능) | 동일 |

로컬에서 `/pm` 경로 테스트:

```bash
# Windows PowerShell
$env:BASE_PATH="/pm"; $env:NEXT_PUBLIC_BASE_PATH="/pm"; npm run build; npm run start
# http://localhost:3000/pm/
```

---

## 13. 데모 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| Master | master@all4land.com | master123 |
| 팀장 | ilho@all4land.com | lead123 |
| 팀원(기획) | changi@all4land.com | member123 |

---

## 14. 공유 링크

회의록 / 일정표 공유 URL 예:

```
https://ucs.all4land.com/pm/share/meetings/?token=...
https://ucs.all4land.com/pm/share/schedule/?token=...
```

---

## 15. 문제 해결

| 증상 | 확인 |
|------|------|
| `/pm/` 502 Bad Gateway | `pm2 status`, `pm2 logs project-manager`, 3000 포트 listen |
| `/pm/` 404 | `BASE_PATH=/pm`으로 **다시 build** 했는지, Apache `ProxyPass` 경로 |
| API 실패 | `curl http://127.0.0.1:3000/pm/api/data/` |
| DB 연결 실패 | `.env` DATABASE_URL, DB명 `ucsdb`, schema `work`, 포트 `11992` |
| UCS 깨짐 | Apache에서 `/ucs/` 설정 변경했는지 확인 |
| CSS/JS 깨짐 | `BASE_PATH=/pm` 빌드 여부, `assetPrefix` |
| redirect 루프 | URL 끝 `/` (trailingSlash) |

---

## 16. 체크리스트

- [ ] Tomcat/UCS `/ucs/` 정상 동작 유지
- [ ] Node 20 + PM2 설치
- [ ] `/home/abs/was/project-manager` 코드 + `.env` (`BASE_PATH=/pm`)
- [ ] `npm run build` 성공
- [ ] `pm2 start` → `curl http://127.0.0.1:3000/pm/api/data/` OK
- [ ] Apache `/pm/` ProxyPass 추가 + `httpd` 재시작
- [ ] `https://ucs.all4land.com/pm/` 로그인 가능
- [ ] pgAdmin: `ucsdb` → schema `work` 테이블 확인

---

## 17. Tomcat 삭제?

**하지 마세요.**
[ucs.all4land.com/ucs/](https://ucs.all4land.com/ucs/index.do) UCS가 Tomcat에서 동작 중입니다.
project-manager만 Node로 **옆에** 추가하는 구조입니다.
