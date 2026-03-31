
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
