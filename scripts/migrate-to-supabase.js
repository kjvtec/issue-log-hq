/**
 * Migration Script: Migrate existing 31 Excel issues & images to Supabase
 * Usage: node scripts/migrate-to-supabase.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read env variables from .env.local
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...vals] = trimmed.split('=');
    env[key.trim()] = vals.join('=').trim();
  });
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
  console.error('\n❌ กรุณาระบุ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env.local ก่อนรัน Migration Script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 เริ่มต้นการ Migration ข้อมูลไปยัง Supabase...');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);

  // 1. Ensure bucket exists
  console.log('\n📦 1. ตรวจสอบ Storage Bucket "issue-attachments"...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'issue-attachments');
  if (!bucketExists) {
    const { error: bErr } = await supabase.storage.createBucket('issue-attachments', { public: true });
    if (bErr) console.warn('Bucket creation notice:', bErr.message);
    else console.log('✅ สร้าง Storage Bucket "issue-attachments" สำเร็จ');
  } else {
    console.log('✅ พบ Storage Bucket "issue-attachments" เรียบร้อยแล้ว');
  }

  // 2. Load issues JSON
  const jsonPath = path.resolve(__dirname, '../src/data/initialIssues.json');
  const issues = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`\n📋 2. พบข้อมูลทั้งหมด ${issues.length} รายการ กำลังนำเข้า Database...`);

  let successCount = 0;
  for (const item of issues) {
    // Check if issue already exists by log_id
    const { data: existing } = await supabase
      .from('issues')
      .select('id, log_id')
      .eq('log_id', item.log_id)
      .maybeSingle();

    let issueId = existing?.id;

    if (!existing) {
      const { data: inserted, error: insErr } = await supabase
        .from('issues')
        .insert({
          log_id: item.log_id,
          priority: item.priority,
          type: item.type,
          module: item.module,
          details: item.details,
          raise_by: item.raise_by,
          raise_date: item.raise_date ? new Date(item.raise_date).toISOString() : new Date().toISOString(),
          status: item.status,
          resolution: item.resolution,
          closed_by: item.closed_by,
          closed_date: item.closed_date ? new Date(item.closed_date).toISOString() : null,
          closed_version: item.closed_version,
          remark: item.remark,
        })
        .select('id')
        .single();

      if (insErr) {
        console.error(`❌ ผิดพลาดในการบันทึก ${item.log_id}:`, insErr.message);
        continue;
      }
      issueId = inserted.id;
    }

    // 3. Upload images for this issue
    if (item.images && item.images.length > 0 && issueId) {
      for (const img of item.images) {
        const localFilePath = path.resolve(__dirname, '../public', img.file_url.replace(/^\//, ''));
        if (fs.existsSync(localFilePath)) {
          const fileBuffer = fs.readFileSync(localFilePath);
          const fileName = img.file_name;
          const storagePath = `legacy/${fileName}`;

          const { error: upErr } = await supabase.storage
            .from('issue-attachments')
            .upload(storagePath, fileBuffer, {
              contentType: 'image/png',
              upsert: true,
            });

          if (!upErr) {
            const { data: publicUrlData } = supabase.storage
              .from('issue-attachments')
              .getPublicUrl(storagePath);

            // Insert into issue_images table
            await supabase.from('issue_images').insert({
              issue_id: issueId,
              file_url: publicUrlData.publicUrl,
              file_name: fileName,
              file_size: fs.statSync(localFilePath).size,
            });
          }
        }
      }
    }

    successCount++;
    process.stdout.write(`\r✅ นำเข้าข้อมูลแล้ว: ${successCount}/${issues.length} รายการ (${item.log_id})`);
  }

  console.log('\n\n🎉 การ Migration เสร็จสิ้นสมบูรณ์!');
  console.log(`รวมนำเข้าข้อมูลทั้งสิ้น: ${successCount} รายการ`);
}

runMigration().catch(console.error);
