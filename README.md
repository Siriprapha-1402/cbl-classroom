# 🎯 CBL Challenge Classroom

ระบบสนับสนุนการจัดการเรียนรู้แบบ **Challenge-Based Learning**  
วิชา: โปรแกรมนำเสนอ | ระดับ: ปวช.1

---

## 🚀 วิธีรันระบบ

### ขั้นตอนที่ 1 — รัน Backend API Server

เปิด Terminal ใหม่ในโฟลเดอร์ `backend`:

```powershell
cd C:\Users\user\.gemini\antigravity\scratch\cbl-classroom\backend
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

> Server จะรันที่ **http://localhost:5000**

---

### ขั้นตอนที่ 2 — รัน Frontend

เปิด Terminal ใหม่อีกอัน ในโฟลเดอร์ `frontend`:

```powershell
cd C:\Users\user\.gemini\antigravity\scratch\cbl-classroom\frontend
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

> Frontend จะรันที่ **http://localhost:3000**

---

## ⚡ การ Deploy ขึ้น Vercel (เชื่อมต่อกับ GitHub)

ระบบนี้รองรับการ Deploy Frontend ขึ้น **Vercel** โดยผูกกับ GitHub Repository อัตโนมัติ (CI/CD):

1. ไปที่เว็บไซต์ **[vercel.com](https://vercel.com)** และเข้าสู่ระบบ (แนะนำ Login ด้วย **Continue with GitHub**)
2. คลิกปุ่ม **"Add New..."** ➔ เลือก **"Project"**
3. ที่ส่วน **Import Git Repository** ให้เลือก **`Siriprapha-1402/cbl-classroom`** แล้วกด **"Import"**
4. ในหน้าตั้งค่าโปรเจกต์ (Configure Project):
   - **Framework Preset:** Vite *(ระบบตรวจพบให้อัตโนมัติ)*
   - **Root Directory:** เลือก `frontend` (หรือปล่อยว่างไว้ตามที่ระบบกำหนดใน `vercel.json`)
   - **Environment Variables:**
     - `VITE_API_URL`: ระบุ URL ของ Backend API เช่น `https://your-backend.onrender.com/api` (หากมี)
5. คลิกปุ่ม **"Deploy"**
6. เมื่อ Deploy เสร็จสิ้น Vercel จะสร้าง Production Domain (เช่น `https://cbl-classroom.vercel.app`) ให้พร้อมใช้งานทันที ทุกครั้งที่มีการ `git push` ขึ้น GitHub Vercel จะอัปเดตให้อัตโนมัติ

---


## 👥 บัญชีผู้ใช้งานในระบบ (Accounts)

### 👨‍🏫 ครูผู้สอน (Teacher)
- **Username:** `Teacheradmin`
- **Password:** `teacheradmin101`
- **ชื่อ-สกุล:** ศิริประภา สมบัติคำ

### 👨‍🎓 นักเรียน (Students - ปวช.1/1 รวม 43 คน)
- **Username:** รหัสประจำตัวนักเรียน (11 หลัก)
- **Password:** รหัสประจำตัวนักเรียน (รหัสเดียวกับ Username)

#### ตัวอย่างบัญชีนักเรียน:
| ลำดับ | รหัสประจำตัวนักเรียน (Username / Password) | ชื่อ - นามสกุล |
|:---:|:---|:---|
| 1 | `69219100001` | นางสาวกฤษณาพร โพธิมี |
| 2 | `69219100002` | นางสาวกุลนัดดา บุญคุง |
| 3 | `69219100003` | นางสาวจันทร์จิรา จูเจ๊ก |
| 4 | `69219100004` | นางสาวจิรภิญญา อินทร์ศรีวงษ์ |
| 5 | `69219100005` | นายจิรายุ สารวงษ์ |
| ... | `69219100006` ~ `69219100043` | (นักเรียนคนที่ 6 ถึง 43) |

---

## 🗂️ โครงสร้างโปรเจกต์

```
cbl-classroom/
├── backend/               # Node.js + Express + SQLite
│   ├── src/
│   │   ├── db/           # Database schema & seed
│   │   ├── middleware/   # JWT Auth, File Upload
│   │   ├── routes/       # API endpoints
│   │   └── services/     # Gamification logic
│   ├── uploads/          # Uploaded files
│   └── package.json
│
├── frontend/              # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/     # Login page
│   │   │   ├── student/  # Student pages (8 pages)
│   │   │   └── teacher/  # Teacher pages (11 pages)
│   │   ├── components/   # Shared UI components
│   │   ├── store/        # Zustand state management
│   │   └── lib/          # API client, utilities
│   └── package.json
│
└── cbl_classroom.db       # SQLite database file
```

---

## 📋 Features

### นักเรียน (Student)
- ✅ Login + Role-based redirect
- ✅ หน้าแรก: Today's Challenge, XP, Level, Deadlines
- ✅ Challenge View: Timer countdown, Missions, Checklist, Submit
- ✅ ผลงานของฉัน: ดูคะแนนและ Feedback
- ✅ ความก้าวหน้า: กราฟ XP, สถิติ
- ✅ Badges: สะสม badge ตามกิจกรรม
- ✅ AI ผู้ช่วย: คำถาม Socratic ช่วยคิด
- ✅ Reflection: สะท้อนการเรียนรู้หลังส่งงาน
- ✅ Notification: แจ้งเตือน badge, feedback

### ครู (Teacher)
- ✅ Dashboard: Summary cards, กราฟ, Activity feed
- ✅ สร้าง Challenge: Multi-step form, missions, checklist
- ✅ จัดกลุ่ม: Manual / Random assign
- ✅ ดูงานที่ส่ง: Filter, ตรวจงาน
- ✅ ให้คะแนน + Feedback
- ✅ ดูนักเรียน: สถิติรายคน, on-time rate, ระบบเลือกหลายคน (Multi-select) และ **ระบบล้างค่าข้อมูลนักเรียน** (ล้าง XP, Badges, ประวัติส่งงาน, กลุ่ม, ประเมินวิจัย, รีเซ็ตรหัสผ่าน ทั้งรายคน รายกลุ่ม และทั้งห้อง)
- ✅ แบบประเมินวิจัย (Assessments):
  - 📋 **แบบบันทึกพฤติกรรมการส่งงาน** (ส่งตรงเวลา / ส่งล่าช้า / ไม่ส่งงาน) ครบ 43 คน พร้อม Auto-Sync จากระบบ
  - ⭐ **แบบประเมินทักษะการปฏิบัติงาน Canva** (4 ด้าน 21 ข้อ 5 ระดับคะแนน เต็ม 105)
  - 🖨️ พิมพ์แบบประเมินทางการขนาด A4 ตามฟอร์มวิจัยต้นฉบับ
  - 📥 ส่งออกข้อมูล CSV สำหรับวิเคราะห์ทางสถิติ (SPSS/Excel)
- ✅ Analytics: กราฟ Recharts หลายแบบ
- ✅ Research Data: Before/After comparison
- ✅ Export: CSV ดาวน์โหลด

### Gamification
- ✅ XP System (Start/Mission/Submit/OnTime/Early/Reflection/Score)
- ✅ 5 Levels: Beginner → Explorer → Creator → Problem Solver → Challenge Master
- ✅ 6 Badges: Deadline Hero, Challenge Master, Early Bird, Creative Thinker, Problem Solver, Consistency

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| State | Zustand |
| Backend | Node.js + Express |
| Database | SQLite (node:sqlite built-in) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Upload | Multer |

---

## 🔑 API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
GET    /api/challenges
POST   /api/challenges
GET    /api/challenges/:id
POST   /api/challenges/:id/start
POST   /api/challenges/:id/submit  (multipart)
POST   /api/missions/:id/complete
POST   /api/checklists/:id/toggle
POST   /api/grade/:studentChallengeId
POST   /api/reflections/challenges/:id
GET    /api/students
GET    /api/students/:id
GET    /api/groups
POST   /api/groups/random
GET    /api/assessments/rubric-definition
GET    /api/assessments/behavior
POST   /api/assessments/behavior/batch
POST   /api/assessments/behavior/auto-sync
GET    /api/assessments/skills
GET    /api/assessments/skills/student/:studentId
POST   /api/assessments/skills
GET    /api/assessments/export/behavior/csv
GET    /api/assessments/export/skills/csv
GET    /api/analytics/class
GET    /api/analytics/research
GET    /api/gamification/my/xp
GET    /api/gamification/my/badges
GET    /api/gamification/my/progress
GET    /api/notifications
GET    /api/export/submissions
GET    /api/export/progress
```
