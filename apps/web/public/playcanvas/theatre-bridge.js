var TheatreBridge = pc.createScript('theatreBridge');

// The name this object will have in the Theatre.js Studio timeline
TheatreBridge.attributes.add('theatreKey', { type: 'string', default: 'WonderBox' });

TheatreBridge.prototype.initialize = function() {
    // 1. Get the global Theatre.js objects we exposed in the Page setup
    const { getProject, t } = window;
    const project = getProject('WonderlandScene');
    const sheet = project.sheet('MainSheet');

    // 2. Create the Theatre.js object for this entity
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

    // 3. Listen for changes on the Theatre.js timeline and update the 3D entity
    this.theatreObj.onValuesChange((values) => {
        this.entity.setPosition(values.position.x, values.position.y, values.position.z);
        this.entity.setEulerAngles(values.rotation.x, values.rotation.y, values.rotation.z);
    });
};
