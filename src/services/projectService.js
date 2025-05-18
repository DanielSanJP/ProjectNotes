import { supabase } from '../lib/supabaseClient';

// Projects
export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const getProject = async (id) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
};

export const createProject = async (project) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select();
    
  if (error) throw error;
  return data[0];
};

export const updateProject = async (id, updates) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
};

export const deleteProject = async (id) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// Notes
export const getNotes = async (projectId) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const getNote = async (id) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
};

export const createNote = async (note) => {
  const { data, error } = await supabase
    .from('notes')
    .insert([note])
    .select();
    
  if (error) throw error;
  return data[0];
};

export const updateNote = async (id, updates) => {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
};

export const deleteNote = async (id) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// Page Sections
export const getPageSections = async (noteId) => {
  const { data, error } = await supabase
    .from('page_sections')
    .select('*')
    .eq('note_id', noteId)
    .order('order_index', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const createPageSection = async (pageSection) => {
  const { data, error } = await supabase
    .from('page_sections')
    .insert([pageSection])
    .select();
    
  if (error) throw error;
  return data[0];
};

export const updatePageSection = async (id, updates) => {
  const { data, error } = await supabase
    .from('page_sections')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
};

export const deletePageSection = async (id) => {
  const { error } = await supabase
    .from('page_sections')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// Image upload
export const uploadImage = async (file, path) => {
  try {
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    console.log(`Attempting to upload file to: ${filePath}`);

    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('design_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);
    return filePath; // Return the file path for URL generation
  } catch (error) {
    console.error('Error in uploadImage function:', error);
    throw error;
  }
};

// Image URL handling - simplified for public bucket
export const getImageUrl = async (filePath) => {
  try {
    // With public bucket, just use getPublicUrl
    const { data: publicData } = supabase.storage
      .from('design_images')
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      throw new Error('Failed to generate URL for image');
    }

    return publicData.publicUrl;
  } catch (error) {
    console.error('Error generating image URL:', error);
    throw error;
  }
};

// Enhanced function to get image URLs for use in your app - simplified for public bucket
export const getImageUrlFromPath = async (path) => {
  try {
    // Make sure we have a valid path
    if (!path) {
      console.error('Empty path provided to getImageUrlFromPath');
      return null;
    }

    // Normalize the path format - if it's a full URL, extract just the path portion
    let normalizedPath = path;
    if (path.includes('supabase.co')) {
      // It's a full URL, extract just the path after the bucket name
      const matches = path.match(/design_images\/(.*)/);
      if (matches && matches[1]) {
        normalizedPath = matches[1];
      }
    }

    // With public bucket, we only need to use the public URL
    const { data: publicData } = supabase.storage
      .from('design_images')
      .getPublicUrl(normalizedPath);

    if (publicData?.publicUrl) {
      console.log(`Using public URL for image ${normalizedPath}`);
      return publicData.publicUrl;
    }

    return null;
  } catch (error) {
    console.error(`Error getting image URL for ${path}:`, error);
    return null;
  }
};

// Simplified direct function for public bucket - doesn't rely on async calls
export const getDirectImageUrl = (imagePath) => {
  try {
    if (!imagePath) return null;
    
    // If it's already a complete URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Normalize the path if needed
    let normalizedPath = imagePath;
    if (imagePath.includes('supabase.co')) {
      // Extract just the path after the bucket name
      const matches = imagePath.match(/design_images\/(.*)/);
      if (matches && matches[1]) {
        normalizedPath = matches[1];
      }
    }
    
    // With public bucket, we can just use getPublicUrl which is synchronous and reliable
    const { data } = supabase.storage
      .from('design_images')
      .getPublicUrl(normalizedPath);
      
    return data?.publicUrl || null;
  } catch (error) {
    console.error(`Error in getDirectImageUrl for ${imagePath}:`, error);
    return null;
  }
};

// Tags
export const getTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const createTag = async (tag) => {
  const { data, error } = await supabase
    .from('tags')
    .insert([tag])
    .select();
    
  if (error) throw error;
  return data[0];
};

export const deleteTag = async (id) => {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// Note Tags
export const getNoteTags = async (noteId) => {
  const { data, error } = await supabase
    .from('note_tags')
    .select('tags:tag_id(*)')
    .eq('note_id', noteId);
    
  if (error) throw error;
  return data.map(item => item.tags);
};

export const addTagToNote = async (noteId, tagId) => {
  const { data, error } = await supabase
    .from('note_tags')
    .insert([{ note_id: noteId, tag_id: tagId }])
    .select();
    
  if (error) throw error;
  return data[0];
};

export const removeTagFromNote = async (noteId, tagId) => {
  const { error } = await supabase
    .from('note_tags')
    .delete()
    .eq('note_id', noteId)
    .eq('tag_id', tagId);
    
  if (error) throw error;
  return true;
};

// Test image access function
// Export the testImageAccess function for backwards compatibility
// but it's no longer needed now that bucket is public
export const testImageAccess = async () => {
  return {
    success: true,
    message: 'Bucket is public, image access should work',
    publicAccess: true,
    signedAccess: null
  };
};