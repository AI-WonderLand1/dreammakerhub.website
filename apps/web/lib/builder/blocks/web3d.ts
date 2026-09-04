import type { BlockDefinition } from '../types';

export const WEB_3D_BLOCKS: BlockDefinition[] = [
  {
    name: '3D Model',
    type: 'model-3d',
    icon: '◈',
    category: 'media',
    description: 'GLB/GLTF model viewer for normal website content',
    defaultProps: {
      src: '',
      alt: 'Interactive 3D model',
      autoRotate: true,
      controls: true,
      background: '#050816',
    },
    defaultStyles: {
      width: '100%',
      height: '480px',
      minHeight: '280px',
      borderRadius: '1rem',
      overflow: 'hidden',
      backgroundColor: '#050816',
      border: '1px solid rgba(139,92,246,0.2)',
    },
    editableProps: [
      { key: 'src', label: 'GLB / GLTF URL', type: 'text' },
      { key: 'alt', label: 'Accessible Label', type: 'text' },
      { key: 'autoRotate', label: 'Auto Rotate', type: 'toggle' },
      { key: 'controls', label: 'Orbit Controls', type: 'toggle' },
      { key: 'background', label: 'Viewer Background', type: 'color' },
    ],
  },
];
