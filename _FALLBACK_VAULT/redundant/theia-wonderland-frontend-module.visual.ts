import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
// import * as pc from 'playcanvas';
// TODO: Fallback: This logic moved to _FALLBACK_VAULT.
import { Puck } from 'puck';

@injectable()
export class WonderlandContribution implements FrontendApplicationContribution {
    
    async onStart(): Promise<void> {
        console.log("AI Wonderland Engines Starting...");
        this.init3D();
        this.initVisualBuilder();
    }

    private init3D(): void {
        const canvas = document.createElement('canvas');
        canvas.id = 'application-canvas';
        canvas.style.cssText = 'position:absolute; top:0; right:0; width:50%; height:100%; z-index:10;';
        document.body.appendChild(canvas);

        const app = new pc.Application(canvas, {
            graphicsDeviceOptions: { antialias: true, alpha: false }
        });
        app.start();
        
        // Basic Neon Cube for Test
        const box = new pc.Entity('cube');
        box.addComponent('model', { type: 'box' });
        box.setLocalScale(2, 2, 2);
        app.root.addChild(box);
    }

    private initVisualBuilder(): void {
        const container = document.createElement('div');
        container.id = 'puck-root';
        container.style.cssText = 'position:absolute; top:0; left:0; width:50%; height:100%;';
        document.body.appendChild(container);
        
        // Initialize Puck/Shadcn here
        console.log("Puck Visual Builder Ready");
    }
}

export default new ContainerModule(bind => {
    bind(FrontendApplicationContribution).to(WonderlandContribution).inSingletonScope();
});
