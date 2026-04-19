import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = '3d-assets';

async function uploadSceneFiles() {
  const templatesDir = path.join(__dirname, '../templates/3d');
  
  try {
    // Check if bucket exists, create if needed
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
    }
    
    // Read all JSON scene files
    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${files.length} scene files to upload:`);
    
    for (const file of files) {
      const filePath = path.join(templatesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Uploading: ${file}`);
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(file, fileContent, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading ${file}:`, error);
      } else {
        console.log(`✓ Uploaded: ${file}`);
      }
    }
    
    // List files to verify upload
    const { data: uploadedFiles, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('');
    
    if (listError) {
      console.error('Error listing uploaded files:', listError);
    } else {
      console.log('\nUploaded files:');
      uploadedFiles?.forEach(file => {
        console.log(`- ${file.name}`);
      });
    }
    
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

uploadSceneFiles();