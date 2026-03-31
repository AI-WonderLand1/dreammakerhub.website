
class SupabaseDrive {
    constructor(supabaseClient, bucketName) {
        this.supabase = supabaseClient;
        this.bucketName = bucketName || 'webgl-assets'; // Use provided bucket or a default
    }

    // Upload a file to Supabase Storage
    async uploadFile(path, file) {
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(path, file);
        if (error) {
            console.error('Error uploading file:', error);
            return null;
        }
        return data;
    }

    // List files from a folder in Supabase Storage
    async listFiles(path = '') {
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .list(path, {
                limit: 100, // Adjust as needed
                offset: 0,
                sortBy: { column: 'name', order: 'asc' },
            });
        if (error) {
            console.error('Error listing files:', error);
            return [];
        }
        return data;
    }

    // Get the public URL for a file
    getPublicUrl(path) {
        const { data } = this.supabase.storage
            .from(this.bucketName)
            .getPublicUrl(path);
        return data.publicUrl;
    }
    
    // Download a file
    async downloadFile(path) {
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .download(path);
        if(error) {
            console.error('Error downloading file:', error);
            return null;
        }
        return data;
    }
    
    // Save scene data to a 'scenes' table in Supabase
    async saveScene(sceneId, sceneData) {
        // We are using JSON.stringify to store scene data.
        const { data, error } = await this.supabase
            .from('scenes') // Assuming you have a 'scenes' table
            .upsert({ id: sceneId, data: JSON.stringify(sceneData) });

        if (error) {
            console.error('Error saving scene:', error);
            return null;
        }
        return data;
    }

    // Load scene data from Supabase
    async loadScene(sceneId) {
        const { data, error } = await this.supabase
            .from('scenes')
            .select('data')
            .eq('id', sceneId)
            .single();
        
        if (error) {
            console.error('Error loading scene:', error);
            return null;
        }

        // We need to parse the scene data
        if(data && data.data) {
            return JSON.parse(data.data);
        }

        return null;
    }
}

// Instantiate and attach to a global scope to be accessible from WebGLStudio
// This requires you to have the Supabase client initialized and attached to window.supabase
if(window.supabase) {
    // The bucketName will now need to be passed in during initialization
    // For example: window.supabaseDrive = new SupabaseDrive(window.supabase, userDefinedBucketName);
}
