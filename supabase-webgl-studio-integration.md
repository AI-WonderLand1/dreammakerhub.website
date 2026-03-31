# Integrating Supabase for File Operations in WebGLStudio.js

This guide outlines how to replace the default LiteFileSystem in WebGLStudio.js with Supabase for all file operations. This will allow you to store and manage your project assets and scenes in your Supabase backend.

## 1. Supabase Client Setup

First, ensure you have the Supabase client initialized in your project. You should have your Supabase URL and anon key.

```javascript
// A good place for this is in your main index.html or a core script file.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Make the supabase client globally accessible for webglstudio
window.supabase = supabase;
```

## 2. The SupabaseDrive Bridge

We will create a bridge class `SupabaseDrive` to handle all interactions with Supabase Storage and Database. This class will mimic the interface that WebGLStudio's `DriveModule` expects.

Create a new file, for example `supabase-drive.js`, and add the following code:

```javascript
class SupabaseDrive {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.bucketName = 'webgl-assets'; // Or your chosen bucket name
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
window.supabaseDrive = new SupabaseDrive(window.supabase);
```

## 3. Replacing WebGLStudio's File System

Now, you need to modify WebGLStudio to use your `SupabaseDrive`. A good place to do this is during the initialization of `DriveModule`.

In `public/webglstudio/webglstudio.js-master/editor/js/modules/drive.js`, inside the `init` function, you can replace the existing filesystem logic. Be warned, this is a significant change that will require you to trace and replace all instances of the old file system calls.

```javascript
// In public/webglstudio/webglstudio.js-master/editor/js/modules/drive.js

// ... inside DriveModule

    init: function()
    {
        // ... other init code ...
        
        // Replace the default filesystem with our SupabaseDrive
        if(window.supabaseDrive) {
            LS.GlobalState.filesystem = window.supabaseDrive;
            console.log("WebGLStudio is now using Supabase for file storage.");
        }
        else {
            console.warn("SupabaseDrive not found. Falling back to default filesystem.");
        }
    },
    
//...
```

## 4. How-to Guide with Supabase

Here's how to perform common operations using the `SupabaseDrive` bridge.

### How to Upload GLB files

```javascript
// Assume 'file' is a File object from an input element
const file = fileInputElement.files[0];
const path = `projects/YOUR_PROJECT_ID/assets/${file.name}`;

const data = await window.supabaseDrive.uploadFile(path, file);

if (data) {
    console.log('File uploaded successfully:', data.path);
    const resource_url = window.supabaseDrive.getPublicUrl(data.path);
    LS.RM.registerResource( resource_url, {
        filename: path,
        fullpath: resource_url,
        category: "Mesh"
    });
    DriveModule.refreshTree();
}
```

### How to List Project Assets

```javascript
const projectId = 'your-project-id';
const assetPath = `projects/${projectId}/assets`;

const files = await window.supabaseDrive.listFiles(assetPath);

if(files) {
    console.log('Project assets:', files);
    var folderNode = DriveModule.getFolderNode(assetPath, true);
    folderNode.children = [];
    
    files.forEach(file => {
        const resource_url = window.supabaseDrive.getPublicUrl(`${assetPath}/${file.name}`);
        folderNode.children.push({
            id: resource_url,
            name: file.name,
            data: {
                filename: `${assetPath}/${file.name}`,
                fullpath: resource_url,
                filesize: file.metadata.size,
                "content-type": file.metadata.mimetype
            }
        });
    });
    
    DriveModule.refreshTree();
}
```

### How to Load Assets into the Editor

```javascript
const resource_url = window.supabaseDrive.getPublicUrl('projects/your-project-id/assets/model.glb');
LS.RM.load(resource_url, function(resource) {
    if (resource) {
        console.log('Resource loaded:', resource);
        var node = new LS.SceneNode();
        node.addComponent(new LS.Components.MeshRenderer({ mesh: resource.name }));
        LS.GlobalState.scene.root.addChild(node);
    }
});
```

### How to Save Scenes to Supabase

```javascript
const scene = LS.GlobalState.scene.serialize();
const sceneId = 'current-scene-id';

const result = await window.supabaseDrive.saveScene(sceneId, scene);

if (result) {
    console.log('Scene saved successfully');
}
```

### How to Load Scenes from Supabase

```javascript
const sceneId = 'current-scene-id';

const sceneData = await window.supabaseDrive.loadScene(sceneId);

if (sceneData) {
    LS.GlobalState.scene.clear();
    LS.GlobalState.scene.configure(sceneData);
    console.log('Scene loaded successfully');
}
```
