var TheatreBridge = pc.createScript('theatreBridge');

TheatreBridge.attributes.add('theatreKey', { type: 'string', default: 'WonderBox' });
TheatreBridge.attributes.add('enableLipSync', { type: 'boolean', default: false });
TheatreBridge.attributes.add('mouthMorph', { type: 'string', default: 'mouthOpen', title: 'Mouth Open Morph' });
TheatreBridge.attributes.add('jawMorph', { type: 'string', default: 'jawOpen', title: 'Jaw Open Morph' });
TheatreBridge.attributes.add('lipsMorph', { type: 'string', default: 'mouthPucker', title: 'Lips Pucker Morph' });

TheatreBridge.prototype.initialize = function() {
    const { getProject, t } = window;
    const project = getProject('WonderlandScene');
    const sheet = project.sheet('MainSheet');

    this.theatreObj = sheet.object(this.theatreKey, {
        position: {
            x: t.number(this.entity.getPosition().x, { nudgeMultiplier: 0.1 }),
            y: t.number(this.entity.getPosition().y, { nudgeMultiplier: 0.1 }),
            z: t.number(this.entity.getPosition().z, { nudgeMultiplier: 0.1 }),
        },
        rotation: {
            x: t.number(this.entity.getEulerAngles().x, { range: [-180, 180] }),
            y: t.number(this.entity.getEulerAngles().y, { range: [-180, 180] }),
            z: t.number(this.entity.getEulerAngles().z, { range: [-180, 180] }),
        }
    });

    this.morphTargets = {};
    this.currentViseme = { mouth: 0, jaw: 0, lips: 0 };
    
    this._findMorphTargets();

    this.theatreObj.onValuesChange((values) => {
        this.entity.setPosition(values.position.x, values.position.y, values.position.z);
        this.entity.setEulerAngles(values.rotation.x, values.rotation.y, values.rotation.z);
    });
};

TheatreBridge.prototype._findMorphTargets = function() {
    if (!this.enableLipSync) return;
    
    const meshInstances = this.entity.findComponents('render')?.length 
        ? this.entity.render.meshInstances 
        : this.entity.model?.meshInstances || [];
    
    for (const mi of meshInstances) {
        const mesh = mi.mesh;
        if (mesh.morph) {
            const morphInstance = mi.morphInstance;
            const morphNames = mesh.morph.targetNames || [];
            
            for (let i = 0; i < morphNames.length; i++) {
                const name = morphNames[i].toLowerCase();
                if (name.includes(this.mouthMorph.toLowerCase())) {
                    this.morphTargets.mouth = { instance: morphInstance, index: i };
                }
                if (name.includes(this.jawMorph.toLowerCase())) {
                    this.morphTargets.jaw = { instance: morphInstance, index: i };
                }
                if (name.includes(this.lipsMorph.toLowerCase())) {
                    this.morphTargets.lips = { instance: morphInstance, index: i };
                }
            }
        }
    }
};

TheatreBridge.prototype.setViseme = function(mouth, jaw, lips) {
    this.currentViseme = { mouth, jaw, lips };
    this._applyViseme();
};

TheatreBridge.prototype._applyViseme = function() {
    if (!this.enableLipSync) return;
    
    if (this.morphTargets.mouth) {
        this.morphTargets.mouth.instance.setWeight(this.morphTargets.mouth.index, this.currentViseme.mouth);
    }
    if (this.morphTargets.jaw) {
        this.morphTargets.jaw.instance.setWeight(this.morphTargets.jaw.index, this.currentViseme.jaw);
    }
    if (this.morphTargets.lips) {
        this.morphTargets.lips.instance.setWeight(this.morphTargets.lips.index, this.currentViseme.lips);
    }
};

TheatreBridge.prototype.playLipSync = function(visemes, onComplete) {
    if (!this.enableLipSync || !visemes?.length) {
        if (onComplete) onComplete();
        return;
    }
    
    const startTime = Date.now();
    const totalDuration = visemes[visemes.length - 1].timestamp + 100;
    
    const update = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= totalDuration) {
            this.setViseme(0, 0, 0);
            if (onComplete) onComplete();
            return;
        }
        
        let current = visemes[0];
        let next = visemes[1];
        
        for (let i = 0; i < visemes.length - 1; i++) {
            if (elapsed >= visemes[i].timestamp && elapsed < visemes[i + 1].timestamp) {
                current = visemes[i];
                next = visemes[i + 1];
                break;
            }
        }
        
        const t = next 
            ? (elapsed - current.timestamp) / (next.timestamp - current.timestamp) 
            : 0;
        
        this.setViseme(
            current.mouth * (1 - t) + (next?.mouth || 0) * t,
            current.jaw * (1 - t) + (next?.jaw || 0) * t,
            current.lips * (1 - t) + (next?.lips || 0) * t
        );
        
        requestAnimationFrame(update);
    };
    
    update();
};

if (typeof window !== 'undefined') {
    window.TheatreBridge = TheatreBridge;
    window.triggerLipSync = function(visemes) {
        const entities = typeof pc !== 'undefined' 
            ? pc.app.root.findComponents('script').filter(c => c.has('theatreBridge'))
            : [];
        entities.forEach(c => c.theatreBridge?.playLipSync(visemes));
    };
}
