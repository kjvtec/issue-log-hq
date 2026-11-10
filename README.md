# ระบบ Issue Log Tracking (VTec Cloud HQ - Jiffy)

ระบบบันทึก ติดตาม และจัดการ Issue Log พัฒนาด้วย **Next.js (App Router)**, **Tailwind CSS**, และเชื่อมต่อกับ **Supabase (PostgreSQL + Cloud Storage)** ออกแบบมาเพื่อทดแทนและต่อยอดจากไฟล์ Excel เดิม รองรับการแปะรูปหน้าจอด้วย `Ctrl + V` และจัดระเบียบข้อมูลได้อย่างมีประสิทธิภาพ พร้อม Deploy บน **Vercel**

---

## 🌟 ฟีเจอร์เด่น (Key Features)

1. **Table / Data Grid View คล่องตัวแบบ Excel**
   - แสดงรายการ Issue พร้อมสีแยกตาม Priority (`High`, `Medium`, `Low`) และ Status (`Open`, `In Progress`, `Test`, `Closed`)
   - ระบบค้นหาและตัวกรองครบวงจร: ค้นหาข้อความ, กรองตาม Status, Priority, Module, และผู้แจ้ง
   - รองรับการจัดเรียง (Sorting) ทุกคอลัมน์
2. **ระบบแนบรูปภาพอัจฉริยะ (Smart Image Uploader)**
   - **กด Ctrl + V เพื่อแปะรูปหน้าจอจาก Clipboard ได้ทันที** ไม่ต้องเซฟรูปลงเครื่องก่อน
   - Drag & Drop หรือเลือกไฟล์รูปภาพได้หลายรูปพร้อมกัน
   - **Client-side Image Optimization**: บีบอัดรูปภาพอัตโนมัติก่อนส่งขึ้น Cloud Storage ช่วยประหยัดเนื้อที่ Storage ไปกว่า 70% และโหลดภาพได้รวดเร็ว
   - มี **Lightbox Modal** คลิกขยายดูภาพหน้าจอขนาดใหญ่เต็มจอพร้อมปุ่มซูมและเปิดแท็บใหม่
3. **การจัดการ Issue แบบรวดเร็ว (Fast Workflow)**
   - เปลี่ยนสถานะได้ในคลิกเดียว (Open -> Ready for Test -> Close Issue)
   - ฟอร์มเลือกชื่อผู้แจ้ง (Raise By) และผู้ปิดงาน (Closed By) จากรายชื่อทีมโดยไม่ต้อง Login
   - ระบบรัน Log ID ถัดไปให้อัตโนมัติ (เช่น `ISSUE_32`, `ISSUE_33`)
4. **Excel Integration**
   - **Export to Excel (.xlsx)**: ดาวน์โหลดรายการที่กรองอยู่หรือทั้งหมดเป็นไฟล์ Excel สรุปผลได้ทันที
   - **Migration Script**: ดึงข้อมูลเดิมทั้ง 31 รายการจาก `Issue Log HQ_20261109_Jiffy.xlsx` พร้อมแตกรูปภาพจากชีตย่อยอัปโหลดขึ้น Supabase อัตโนมัติ

---

## 🛠️ โครงสร้างเทคโนโลยี (Tech Stack)

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Excel Handling**: SheetJS (`xlsx`)
- **Image Processing**: `browser-image-compression`
- **Database & Storage**: Supabase (PostgreSQL + Storage Bucket `issue-attachments`)
- **Hosting / Deployment**: Vercel

---

## 🚀 ขั้นตอนการเปิดใช้งานระบบ (Getting Started)

### ขั้นตอนที่ 1: เตรียม Database บน Supabase
1. เข้าไปที่ [Supabase Dashboard](https://supabase.com/dashboard) แล้วเปิดโปรเจกต์ของคุณ
2. ไปที่เมนู **SQL Editor** (ไอคอน `>_` ด้านซ้าย)
3. คัดลอกโค้ดจากไฟล์ [`supabase/schema.sql`](file:///d:/BCN/Issue%20Logs/supabase/schema.sql) ทั้งหมดไปวาง แล้วกดปุ่ม **RUN**
   *(สคริปต์นี้จะสร้างตาราง `issues`, `issue_images`, `team_members`, `modules`, ตั้งค่า RLS และสร้าง Storage Bucket `issue-attachments` ให้เรียบร้อยในคลิกเดียว)*

---

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables
1. ใน Supabase Dashboard ไปที่เมนู **Project Settings** -> **API**
2. คัดลอก **Project URL** และ **anon / public key**
3. เปิดไฟล์ [`.env.local`](file:///d:/BCN/Issue%20Logs/.env.local) แล้วกรอกค่า:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### ขั้นตอนที่ 3: รัน Migration Script นำเข้าข้อมูลเดิมจาก Excel (31 รายการ)
รันคำสั่งใน Terminal:
```bash
node scripts/migrate-to-supabase.js
```
สคริปต์จะนำเข้าทั้ง 31 รายการ พร้อมอัปโหลดรูปภาพหลักฐานทั้งหมดขึ้น Supabase Storage ให้อัตโนมัติ

---

### ขั้นตอนที่ 4: รันระบบทดสอบในเครื่อง (Local Dev)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 🌐 ขั้นตอนการ Deploy ขึ้น Vercel

1. Push โค้ดขึ้น GitHub / GitLab / Bitbucket
2. เข้าไปที่ [Vercel Dashboard](https://vercel.com) แล้วคลิก **"Add New Project"**
3. เลือก Repository ที่เพิ่ง Push ขึ้นไป
4. ในส่วน **Environment Variables** ให้ใส่ 2 ค่าเดียวกับใน `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. กดปุ่ม **Deploy** ระบบจะ Build และพร้อมใช้งานได้ทันทีทั่วโลก!
