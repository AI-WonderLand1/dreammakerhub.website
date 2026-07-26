import { classifySpatialGesture } from '../core/spatial';
import { IntentDetector } from '../core/intent';
import { classifyLateralMotion } from '../core/patterns';
export class BabylonGestureBridge {
    intentDetector;
    samples = [];
    config;
    animationFrameId = null;
    lastEvent = null;
    canvas = null;
    targetMesh = null;
    targetCamera = null;
    mouseDown = false;
    lastMouseX = 0;
    lastMouseY = 0;
    lastMouseTime = 0;
    SMOOTH_WEIGHT = 0.15;
    smoothRot = [0, 0, 0];
    smoothPos = [0, 0, 0];
    smoothScale = [1, 1, 1];
    constructor(config) {
        this.intentDetector = new IntentDetector(800);
        this.config = {
            enabled: true,
            sensitivity: 1.0,
            smoothing: 0.85,
            ...config,
        };
    }
    updateConfig(partial) {
        const wasEnabled = this.config.enabled;
        Object.assign(this.config, partial);
        if (wasEnabled && !this.config.enabled) {
            this.stopAnimationLoop();
        }
        else if (!wasEnabled && this.config.enabled) {
            this.startAnimationLoop();
        }
    }
    setTargetMesh(mesh) {
        this.targetMesh = mesh;
        this.targetCamera = null;
    }
    setTargetCamera(camera) {
        this.targetCamera = camera;
        this.targetMesh = null;
    }
    enable() {
        this.config.enabled = true;
        if (this.canvas) {
            this.attachInputListeners(this.canvas);
        }
        this.startAnimationLoop();
    }
    disable() {
        this.config.enabled = false;
        this.detachInputListeners();
        this.stopAnimationLoop();
    }
    attach(canvas) {
        this.canvas = canvas;
        this.attachInputListeners(canvas);
        this.startAnimationLoop();
    }
    detach() {
        this.detachInputListeners();
        this.stopAnimationLoop();
        this.canvas = null;
    }
    attachInputListeners(canvas) {
        canvas.addEventListener('mousedown', this.handleMouseDown);
        canvas.addEventListener('mousemove', this.handleMouseMove);
        canvas.addEventListener('mouseup', this.handleMouseUp);
        canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    }
    detachInputListeners() {
        if (!this.canvas)
            return;
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
    handleMouseDown = (e) => {
        if (!this.config.enabled)
            return;
        this.mouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.lastMouseTime = performance.now();
    };
    handleMouseMove = (e) => {
        if (!this.mouseDown || !this.config.enabled)
            return;
        this.processInput(e.clientX, e.clientY, performance.now());
    };
    handleMouseUp = () => {
        this.mouseDown = false;
        this.samples = [];
    };
    handleTouchStart = (e) => {
        if (!this.config.enabled)
            return;
        e.preventDefault();
        const touch = e.touches[0];
        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
        this.lastMouseTime = performance.now();
    };
    handleTouchMove = (e) => {
        if (!this.config.enabled)
            return;
        e.preventDefault();
        const touch = e.touches[0];
        this.processInput(touch.clientX, touch.clientY, performance.now());
    };
    handleTouchEnd = () => {
        this.samples = [];
    };
    processInput(clientX, clientY, timestamp) {
        const dx = clientX - this.lastMouseX;
        const dy = clientY - this.lastMouseY;
        const dt = Math.max(timestamp - this.lastMouseTime, 1);
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt * this.config.sensitivity;
        const sample = {
            timestamp,
            wrist: {
                x: clientX / (this.canvas?.width || 1920),
                y: clientY / (this.canvas?.height || 1080),
                z: 0,
            },
            velocity,
            direction: Math.atan2(dy, dx),
        };
        this.samples.push(sample);
        this.intentDetector.addSample(sample);
        this.lastMouseX = clientX;
        this.lastMouseY = clientY;
        this.lastMouseTime = timestamp;
    }
    startAnimationLoop() {
        const loop = () => {
            if (!this.config.enabled) {
                this.animationFrameId = null;
                return;
            }
            this.update();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }
    stopAnimationLoop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    update() {
        if (this.samples.length < 2)
            return;
        const intent = this.intentDetector.evaluate();
        if (!intent.isIntentional)
            return;
        const lateralGesture = classifyLateralMotion(this.samples);
        const spatialGesture = classifySpatialGesture(this.samples, lateralGesture);
        if (spatialGesture.confidence < 0.3)
            return;
        const event = {
            gesture: spatialGesture.gesture,
            rotation: spatialGesture.transform.rotation,
            position: spatialGesture.transform.position,
            scale: spatialGesture.transform.scale,
            confidence: spatialGesture.confidence * intent.confidence,
        };
        this.lastEvent = event;
        this.applyGesture(event);
    }
    applyGesture(event) {
        const sm = 1 - this.config.smoothing;
        this.smoothRot[0] += (event.rotation.x * 0.02 * sm - this.smoothRot[0]) * this.SMOOTH_WEIGHT;
        this.smoothRot[1] += (event.rotation.y * 0.02 * sm - this.smoothRot[1]) * this.SMOOTH_WEIGHT;
        this.smoothRot[2] += (event.rotation.z * 0.02 * sm - this.smoothRot[2]) * this.SMOOTH_WEIGHT;
        this.smoothPos[0] += ((event.position.x - 0.5) * 0.5 * sm - this.smoothPos[0]) * this.SMOOTH_WEIGHT;
        this.smoothPos[1] += ((event.position.y - 0.5) * 0.5 * sm - this.smoothPos[1]) * this.SMOOTH_WEIGHT;
        this.smoothPos[2] += (event.position.z * sm - this.smoothPos[2]) * this.SMOOTH_WEIGHT;
        this.smoothScale[0] += (event.scale.x * sm - this.smoothScale[0]) * this.SMOOTH_WEIGHT;
        this.smoothScale[1] += (event.scale.y * sm - this.smoothScale[1]) * this.SMOOTH_WEIGHT;
        this.smoothScale[2] += (event.scale.z * sm - this.smoothScale[2]) * this.SMOOTH_WEIGHT;
        if (this.targetCamera) {
            this.applyToCamera(event);
        }
        else if (this.targetMesh) {
            this.applyToMesh(event);
        }
    }
    applyToMesh(event) {
        const m = this.targetMesh;
        if (!m)
            return;
        if (event.gesture === 'swipe') {
            m.rotation.x += this.smoothRot[0];
            m.rotation.y += this.smoothRot[1];
            m.rotation.z += this.smoothRot[2];
            m.position.x += this.smoothPos[0];
            m.position.y -= this.smoothPos[1];
        }
        if (event.gesture === 'wave') {
            const s = this.smoothScale[0];
            m.scaling.x = s;
            m.scaling.y = s;
            m.scaling.z = s;
        }
    }
    applyToCamera(event) {
        const cam = this.targetCamera;
        if (!cam)
            return;
        if (event.gesture === 'swipe') {
            cam.alpha += event.position.x * 0.1;
            cam.beta = Math.max(0.1, Math.min(Math.PI - 0.1, cam.beta + event.position.y * 0.1));
        }
        if (event.gesture === 'wave') {
            cam.radius = Math.max(1, cam.radius + (1 - event.scale.x) * 5);
        }
    }
    get lastKnownEvent() {
        return this.lastEvent;
    }
    resetSamples() {
        this.samples = [];
        this.intentDetector.reset();
    }
    destroy() {
        this.detach();
        this.samples = [];
        this.lastEvent = null;
        this.targetMesh = null;
        this.targetCamera = null;
    }
}
