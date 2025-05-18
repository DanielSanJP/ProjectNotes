import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check bucket permissions and image URLs
export const checkStorageBucketAccess = async (bucketName) => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return { success: false, message: 'Failed to list buckets', error: bucketError };
    }
    
    const bucket = buckets.find(b => b.name === bucketName);
    if (!bucket) {
      return { success: false, message: `Bucket "${bucketName}" not found` };
    }
    
    // Check bucket public/private status
    const isPublic = bucket.public || false;
    
    console.log(`Bucket "${bucketName}" found. Public access: ${isPublic}`);
    
    return {
      success: true, 
      bucket,
      isPublic,
      message: `Bucket "${bucketName}" is ${isPublic ? 'public' : 'private'}`
    };
  } catch (error) {
    console.error('Error checking bucket access:', error);
    return { success: false, message: 'Error checking bucket access', error };
  }
};

// Create a function to check if images can be loaded from public URLs
export const testImageAccess = async () => {
  try {
    // Get a list of files to test with
    const { data: files, error: listError } = await supabase.storage
      .from('design_images')
      .list('test');
    
    if (listError) {
      console.error('Error listing files:', listError);
      return { 
        success: false, 
        message: 'Could not list files in bucket', 
        error: listError,
        publicAccess: false,
        signedAccess: false
      };
    }
    
    if (!files || files.length === 0) {
      return { 
        success: true, 
        message: 'No files found to test',
        publicAccess: null,
        signedAccess: null
      };
    }
    
    // Try to get a public URL and test if it works
    const testFile = files[0];
    const testPath = `test/${testFile.name}`;
    
    // Test signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('design_images')
      .createSignedUrl(testPath, 60);
      
    const signedAccess = !signedError && signedData?.signedUrl;
    
    // Test public URL 
    const { data: publicData } = supabase.storage
      .from('design_images')
      .getPublicUrl(testPath);
    
    // We can only know for sure if public URL works by actually trying to load the image,
    // but we'll assume it should work if the bucket is public based on metadata
    const { isPublic } = await checkStorageBucketAccess('design_images');
    
    return {
      success: true,
      message: 'Image access test completed',
      publicAccess: isPublic,
      signedAccess: signedAccess,
      testFile: testPath,
      publicUrl: publicData?.publicUrl,
      signedUrl: signedData?.signedUrl
    };
  } catch (error) {
    console.error('Error testing image access:', error);
    return { 
      success: false, 
      message: 'Error testing image access',
      error,
      publicAccess: false,
      signedAccess: false
    };
  }
};