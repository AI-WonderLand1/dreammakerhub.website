import WebModelViewer from '../components/WebModelViewer';
import type { BlockRenderer } from './types';

export const web3dRenderers: Record<string, BlockRenderer> = {
  'model-3d': ({ el, baseProps, style, children }) => (
    <div {...baseProps} style={{ ...style, position: 'relative' }}>
      <WebModelViewer
        src={typeof el.props.src === 'string' ? el.props.src : ''}
        alt={typeof el.props.alt === 'string' ? el.props.alt : 'Interactive 3D model'}
        autoRotate={el.props.autoRotate !== false}
        controls={el.props.controls !== false}
        background={typeof el.props.background === 'string' ? el.props.background : '#050816'}
      />
      {children}
    </div>
  ),
};
