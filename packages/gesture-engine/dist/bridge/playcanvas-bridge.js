import { classifySpatialGesture } from '../core/spatial';
import { IntentDetector } from '../core/intent';
import { classifyLateralMotion } from '../core/patterns';
export class PlayCanvasGestureBridge {
    app;
    intentDetector;
    samples = [];
    targetEntity;
    config;
    animationFrameId = null;
    lastEvent = null;
    canvas = null;
    mouseDown = false;
    lastMouseX = 0;
    lastMouseY = 0;
    lastMouseTime = 0;
    accumulatedEvent = {};
    constructor(app, config) {
        this.app = app;
        this.intentDetector = new IntentDetector(800);
        this.config = {
            enabled: true,
            sensitivity: 1.0,
            smoothing: 0.85,
            ...config,
        };
    }
    setTarget(entity) {
        this.targetEntity = entity;
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
            if (!this.config.enabled || !this.app) {
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
        if (this.samples.length < 2 || !this.app)
            return;
        const intent = this.intentDetector.evaluate();
        if (!intent.isIntentional) {
            this.accumulatedEvent = {};
            return;
        }
        const lateralGesture = classifyLateralMotion(this.samples);
        const spatialGesture = classifySpatialGesture(this.samples, lateralGesture);
        if (spatialGesture.confidence < 0.3)
            return;
        const event = {
            gesture: spatialGesture.gesture,
            rotation: spatialGesture.transform.rotation,
            position: spatialGesture.transform.position,
            scale: spatialGesture.transform.scale,
            confidence: spatialGesture.confidence,
        };
        event.rotation.x *= intent.confidence;
        event.rotation.y *= intent.confidence;
        event.rotation.z *= intent.confidence;
        this.lastEvent = event;
        this.applyToScene(event);
    }
    applyToScene(event) {
        if (!this.app)
            return;
        const entity = this.targetEntity || this.getDefaultTarget();
        if (!entity)
            return;
        if (entity.getComponent('camera')) {
            this.applyCameraTransform(entity, event);
        }
        else if (entity.getComponent('render')) {
            this.applyObjectTransform(entity, event);
        }
    }
    getDefaultTarget() {
        if (!this.app?.root)
            return null;
        const children = this.app.root.getChildren();
        for (const child of children) {
            if (child.getComponent('render') || child.name === 'Camera') {
                return child;
            }
        }
        return this.app.root;
    }
    applyCameraTransform(entity, event) {
        const smoothFactor = 1 - this.config.smoothing;
        const currentRot = entity.getEulerAngles();
        entity.setEulerAngles(currentRot.x + event.rotation.x * smoothFactor * 0.1, currentRot.y + event.rotation.y * smoothFactor * 0.1, currentRot.z + event.rotation.z * smoothFactor * 0.1);
        if (event.gesture === 'swipe') {
            const currentPos = entity.getPosition();
            entity.setPosition(currentPos.x + event.position.x * smoothFactor * 0.5, currentPos.y + event.position.y * smoothFactor * 0.5, currentPos.z);
        }
        if (event.gesture === 'wave') {
            const currentScale = entity.getLocalScale();
            entity.setLocalScale(currentScale.x * event.scale.x, currentScale.y * event.scale.y, currentScale.z * event.scale.z);
        }
    }
    applyObjectTransform(entity, event) {
        const smoothFactor = 1 - this.config.smoothing;
        const currentRot = entity.getEulerAngles();
        entity.setEulerAngles(currentRot.x + event.rotation.x * smoothFactor * 0.05, currentRot.y + event.rotation.y * smoothFactor * 0.05, currentRot.z + event.rotation.z * smoothFactor * 0.05);
        if (event.gesture === 'swipe') {
            const currentPos = entity.getPosition();
            entity.setPosition(currentPos.x + event.position.x * smoothFactor * 0.1, currentPos.y - event.position.y * smoothFactor * 0.1, currentPos.z);
        }
        if (event.gesture === 'wave') {
            const currentScale = entity.getLocalScale();
            entity.setLocalScale(currentScale.x + (event.scale.x - currentScale.x) * smoothFactor, currentScale.y + (event.scale.y - currentScale.y) * smoothFactor, currentScale.z + (event.scale.z - currentScale.z) * smoothFactor);
        }
    }
    get lastKnownEvent() {
        return this.lastEvent;
    }
    destroy() {
        this.detach();
        this.samples = [];
        this.lastEvent = null;
        this.targetEntity = null;
    }
}
