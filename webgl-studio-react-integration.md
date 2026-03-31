# Embedding WebGLStudio in React & Building a Custom Asset Library

This guide provides a complete walkthrough for embedding a stripped-down WebGLStudio editor into a Next.js React component and building a custom asset library panel that interacts with your application and Supabase.

## 1. Embedding WebGLStudio in a React Component

The most robust method for embedding a complex, non-React application like WebGLStudio is to use an `<iframe>`. This encapsulates the editor's styles and scripts, preventing conflicts with your main application.

### Step 1: Create the React Component

Create a new component in your Next.js app, for example, `components/WebGLStudioViewer.tsx`.

```tsx
// components/WebGLStudioViewer.tsx
import React, { useEffect, useRef } from 'react';

interface WebGLStudioViewerProps {
    src: string; // The URL to your WebGLStudio editor
}

const WebGLStudioViewer: React.FC<WebGLStudioViewerProps> = ({ src }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Function to send commands to the editor
    const sendCommand = (command: string, data: any) => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ command, data }, '*');
        }
    };

    useEffect(() => {
        // --- How to listen for events from the editor ---
        const handleMessage = (event: MessageEvent) => {
            // Optional: Check the origin for security
            // if (event.origin !== "http://your-editor-url.com") return;

            const { event: editorEvent, data } = event.data;

            switch (editorEvent) {
                case 'scene:node-selected':
                    console.log('Node selected in editor:', data);
                    // You can now update your React state with this data
                    break;
                case 'asset:add-to-playcanvas':
                    console.log('Asset added, ready for PlayCanvas:', data);
                    // Call your PlayCanvas loading function here
                    // e.g., loadAssetInPlayCanvas(data.url);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // Example of sending a command to the editor
    const handleLoadScene = () => {
        sendCommand('scene:load', { sceneId: 'your-scene-id' });
    };

    return (
        <div>
            <button onClick={handleLoadScene}>Load Scene</button>
            <iframe
                ref={iframeRef}
                src={src}
                width="100%"
                height="800px"
                frameBorder="0"
                title="WebGLStudio Editor"
            />
        </div>
    );
};

export default WebGLStudioViewer;
```

### Step 2: Modify WebGLStudio to Handle Commands

In WebGLStudio's `core.js`, add a listener to handle incoming messages from the parent React app.

```javascript
// In public/webglstudio/webglstudio.js-master/editor/js/core.js
// ... inside CORE.init function

window.addEventListener("message", function(event) {
    var command = event.data.command;
    var data = event.data.data;

    switch(command)
    {
        case "scene:load":
            // Assuming you have your SupabaseDrive setup
            if(window.supabaseDrive && data.sceneId) {
                window.supabaseDrive.loadScene(data.sceneId).then(function(sceneData) {
                    if (sceneData) {
                        LS.GlobalState.scene.clear();
                        LS.GlobalState.scene.configure(sceneData);
                        console.log("Scene loaded via command from React");
                    }
                });
            }
            break;
        // Add more commands as needed
    }
});
```

## 2. Building a Custom 3D Asset Library Panel

This involves creating a new module in WebGLStudio to render a panel that fetches and displays your assets.

### Step 1: Create the `AssetLibraryModule`

Create a new file: `public/webglstudio/webglstudio.js-master/editor/js/modules/assetLibrary.js`

```javascript
// assetLibrary.js

var AssetLibraryModule = {
    name: "asset_library",
    panel: null,

    init: function() {
        // Create a new panel in the editor's right-hand sidebar
        this.panel = LiteGUI.main_tabs.addTab("Asset Library", {
            id: "assetlibrarytab",
            width: "100%",
            height: "100%",
            callback: this.renderPanel.bind(this)
        });
    },

    renderPanel: function(tab) {
        var that = this;
        tab.innerHTML = ""; // Clear previous content
        var inspector = new LiteGUI.Inspector();
        tab.add(inspector.root);

        // --- 1. Primitives Section ---
        inspector.addTitle("Primitives");
        inspector.addButton(null, "Add Cube", function() {
            that.insertPrimitive("cube");
        });
        inspector.addButton(null, "Add Sphere", function() {
            that.insertPrimitive("sphere");
        });
        inspector.addButton(null, "Add Plane", function() {
            that.insertPrimitive("plane");
        });
        inspector.addSeparator();

        // --- 2. AI Generated Assets ---
        inspector.addTitle("AI Generated");
        // Example: You would fetch these from your backend
        inspector.addButton(null, "AI Chair", function() {
            that.insertAssetFromUrl("path/to/ai-chair.glb");
        });
        inspector.addSeparator();

        // --- 3. User Uploaded Assets ---
        inspector.addTitle("My Assets (from Supabase)");
        var assets_area = inspector.addContainer();
        assets_area.style.minHeight = "200px";

        // Fetch and list assets from Supabase
        if(window.supabaseDrive) {
            window.supabaseDrive.listFiles("projects/YOUR_PROJECT_ID/assets").then(function(files) {
                if(!files) return;
                files.forEach(function(file) {
                    var asset_button = inspector.createButton(null, file.name, {
                        callback: function() {
                            var asset_path = "projects/YOUR_PROJECT_ID/assets/" + file.name;
                            that.insertAssetFromUrl(asset_path);
                        }
                    });
                    assets_area.appendChild(asset_button);
                });
            });
        }
    },

    insertPrimitive: function(type) {
        var node = new LS.SceneNode();
        var mesh;
        switch(type) {
            case "cube": mesh = GL.Mesh.cube(); break;
            case "sphere": mesh = GL.Mesh.sphere(); break;
            case "plane": mesh = GL.Mesh.plane({xz: true}); break;
        }
        node.addComponent(new LS.Components.MeshRenderer({ mesh: mesh }));
        LS.GlobalState.scene.root.addChild(node);
        this.notifyReactOfInsert(node, "primitive:" + type, null);
    },

    insertAssetFromUrl: function(path) {
        var publicUrl = window.supabaseDrive.getPublicUrl(path);
        LS.RM.load(publicUrl, function(resource) {
            if (resource) {
                var node = new LS.SceneNode();
                node.addComponent(new LS.Components.MeshRenderer({ mesh: resource.name }));
                LS.GlobalState.scene.root.addChild(node);
                that.notifyReactOfInsert(node, resource.name, publicUrl);
            }
        });
    },
    
    // --- How to expose editor events to React ---
    notifyReactOfInsert: function(node, name, url) {
        // Send a message to the parent window (your React app)
        window.parent.postMessage({
            event: "asset:add-to-playcanvas",
            data: {
                nodeId: node.uid,
                name: name,
                url: url // This URL can be used to load the asset in PlayCanvas
            }
        }, '*');
    }
};

// Register the module
CORE.registerModule( AssetLibraryModule );
```

### Step 2: Load the New Module

In `public/webglstudio/webglstudio.js-master/editor/index.html`, add the script tag for your new module.

```html
<!-- index.html -->
<script type="text/javascript" src="js/modules/assetLibrary.js"></script>
```

In `public/webglstudio/webglstudio.js-master/editor/js/core.js`, register it.

```javascript
// core.js
// ... in CORE.init
CORE.registerModule( AssetLibraryModule );
//...
```

Now, when you run WebGLStudio, you will see a new "Asset Library" tab on the right. Clicking the buttons will fetch assets from Supabase or create primitives and insert them directly into the scene, while also sending a message to your parent React application to handle the PlayCanvas integration.
