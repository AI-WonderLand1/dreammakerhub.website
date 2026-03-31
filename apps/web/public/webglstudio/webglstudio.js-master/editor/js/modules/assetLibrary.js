
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
            that.insertPrimitive("sphere
            ");
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
