/**
 * PlayCanvasWidget
 * Integrates PlayCanvas into the CanvasManager system.
 * Handles Goku, Spider-Man, and custom AI-generated logic.
 */

function PlayCanvasWidget() {
    this.name = "PlayCanvas";
    this.app = null;
    this.is_initialized = false;
    
    // Priority ensures it renders in the correct order in CanvasManager
    this.canvas_priority = 0; 
}

// Called by CanvasManager when you do addWidget()
PlayCanvasWidget.prototype.init = function(canvasManager) {
    const canvas = canvasManager.canvas;

    // 1. Initialize PlayCanvas Application
    this.app = new pc.Application(canvas, {
        mouse: new pc.Mouse(canvas),
        touch: new pc.TouchDevice(canvas),
        keyboard: new pc.Keyboard(window),
        graphicsDeviceOptions: { alpha: true, antialias: true }
    });

    this.app.start();
    this.app.setCanvasFillMode(pc.FILLMODE_NONE); // Let CanvasManager handle sizing
    
    this.setupBasicScene();
    this.is_initialized = true;
    
    console.log("PlayCanvas Widget Initialized");
};

PlayCanvasWidget.prototype.setupBasicScene = function() {
    const root = this.app.root;

    // Main Camera
    const camera = new pc.Entity("MainCamera");
    camera.addComponent("camera", { 
        clearColor: new pc.Color(0.1, 0.1, 0.1, 1) 
    });
    camera.setPosition(0, 2, 10);
    root.addChild(camera);

    // Directional Light
    const light = new pc.Entity("EditorLight");
    light.addComponent("light", { type: "directional" });
    light.setEulerAngles(45, 45, 0);
    root.addChild(light);
};

/**
 * Interface for the AI Scripting Panel to load assets
 */
PlayCanvasWidget.prototype.loadModel = function(name, url, position) {
    if (!this.app) return;
    
    const entity = new pc.Entity(name);
    if (position) entity.setPosition(position[0], position[1], position[2]);

    this.app.assets.loadFromUrl(url, "container", (err, asset) => {
        if (err) {
            console.error("Failed to load model: " + name, err);
            return;
        }
        entity.addComponent("model", { type: "asset", asset: asset.resource.model });
        this.app.root.addChild(entity);
    });
    
    return entity;
};

// CanvasManager Hooks
PlayCanvasWidget.prototype.render = function(gl, force_frame) {
    // PlayCanvas renders internally via its own requestAnimationFrame,
    // so we return false or true depending on if we want to block other widgets.
    return false; 
};

PlayCanvasWidget.prototype.update = function(dt) {
    // Sync logic per frame
};

// Handle events from CanvasManager's dispatchEvent
PlayCanvasWidget.prototype.onevent = function(e) {
    // Forward events to PlayCanvas if necessary
    return false;
};
