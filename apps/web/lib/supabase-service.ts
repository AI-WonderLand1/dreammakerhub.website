/**
 * Supabase Auth & Subscription Service
 * Handles user authentication, signup, and subscription flows
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// User signup with email/password
export async function signUpUser(email: string, password: string, fullName: string) {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) throw authError;

    // Create user profile
    if (authData.user) {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        subscription_plan: 'free',
        storage_limit: 100, // 100 MB for free tier
        projects_limit: 5,
        created_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
  }
}

// User login
export async function loginUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Get user profile & subscription
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

// Subscribe to plan
export async function subscribeToPlan(
  userId: string,
  plan: 'free' | 'pro' | 'enterprise',
  paymentMethodId?: string
) {
  try {
    // Determine limits based on plan
    const planLimits = {
      free: { storage: 100, projects: 5 },
      pro: { storage: 1000, projects: 50 },
      enterprise: { storage: 10000, projects: 999 },
    };

    const limits = planLimits[plan];

    // Update user subscription
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_plan: plan,
        storage_limit: limits.storage,
        projects_limit: limits.projects,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    // Create subscription record
    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan,
      status: 'active',
      started_at: new Date().toISOString(),
      payment_method_id: paymentMethodId,
    });

    return { success: true, plan };
  } catch (error) {
    console.error('Subscribe error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Subscription failed' };
  }
}

// Create project
export async function createProject(
  userId: string,
  name: string,
  type: 'playcanvas' | 'webgl' | 'puck' | 'theia'
) {
  try {
    const { data, error } = await supabase.from('projects').insert({
      user_id: userId,
      name,
      type,
      storage_used: 0,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true, project: data };
  } catch (error) {
    console.error('Create project error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Project creation failed' };
  }
}

// Get user projects
export async function getUserProjects(userId: string) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get projects error:', error);
    return [];
  }
}

// Save project data to Supabase Storage
export async function saveProjectFile(
  userId: string,
  projectId: string,
  filePath: string,
  fileContent: string
) {
  try {
    const path = `${userId}/${projectId}/${filePath}`;

    const { error } = await supabase.storage
      .from('temp_storage')
      .upload(path, new Blob([fileContent], { type: 'text/plain' }), {
        upsert: true,
        contentType: 'text/plain',
      });

    if (error) throw error;
    return { success: true, path };
  } catch (error) {
    console.error('Save file error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'File save failed' };
  }
}

// Get project files
export async function getProjectFiles(userId: string, projectId: string) {
  try {
    const { data, error } = await supabase.storage
      .from('temp_storage')
      .list(`${userId}/${projectId}`);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get files error:', error);
    return [];
  }
}

// Export project
export async function exportProject(userId: string, projectId: string) {
  try {
    const files = await getProjectFiles(userId, projectId);
    const projectData = {
      projectId,
      files: files.map((f) => f.name),
      exportedAt: new Date().toISOString(),
    };

    return { success: true, data: projectData };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
  }
}

// Logout
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
  }
}
