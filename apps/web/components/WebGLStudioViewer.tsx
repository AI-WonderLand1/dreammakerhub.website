import React, { useEffect, useRef, useCallback } from 'react';

interface WebGLStudioViewerProps {
    src: string; // The URL to your WebGLStudio editor
}

/**
 * Extracts the origin from a URL string.
 * Returns null if the URL is invalid.
 */
function getOriginFromUrl(url: string): string | null {
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

const WebGLStudioViewer: React.FC<WebGLStudioViewerProps> = ({ src }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Memoize the target origin to avoid recalculating on every render
    const targetOrigin = getOriginFromUrl(src) || window.location.origin;

    // Function to send commands to the editor
    const sendCommand = useCallback((command: string, data: unknown) => {
        if (iframeRef.current?.contentWindow) {
            // SECURITY: Use specific origin instead of '*' to prevent message interception
            iframeRef.current.contentWindow.postMessage({ command, data }, targetOrigin);
        }
    }, [targetOrigin]);

    useEffect(() => {
        // --- How to listen for events from the editor ---
        const handleMessage = (event: MessageEvent) => {
            // SECURITY: Verify the message came from the expected origin
            if (event.origin !== targetOrigin) {
                console.warn('Rejected message from unexpected origin:', event.origin);
                return;
            }

            // SECURITY: Verify the message came from our iframe
            if (event.source !== iframeRef.current?.contentWindow) {
                console.warn('Rejected message from unexpected source');
                return;
            }

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
    }, [targetOrigin]);

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
