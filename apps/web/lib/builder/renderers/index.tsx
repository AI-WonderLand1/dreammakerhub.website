import type { ReactNode } from 'react';
import type { RendererCtx } from './types';
import { authRenderers } from './auth';
import { blogRenderers } from './blog';
import { commerceRenderers } from './commerce';
import { filesRenderers } from './files';
import { formsRenderers } from './forms';
import { layoutRenderers } from './layout';
import { marketingRenderers } from './marketing';
import { mediaRenderers } from './media';
import { navigationRenderers } from './navigation';
import { notificationRenderers } from './notification';
import { productsRenderers } from './products';
import { seoRenderers } from './seo';
import { socialRenderers } from './social';
import { typographyRenderers } from './typography';
import { utilityRenderers } from './utility';
import { widgetsRenderers } from './widgets';

export const RENDERERS: Record<string, RendererCtx['el']['type'] extends never ? never : any> = {
  ...authRenderers,
  ...blogRenderers,
  ...commerceRenderers,
  ...filesRenderers,
  ...formsRenderers,
  ...layoutRenderers,
  ...marketingRenderers,
  ...mediaRenderers,
  ...navigationRenderers,
  ...notificationRenderers,
  ...productsRenderers,
  ...seoRenderers,
  ...socialRenderers,
  ...typographyRenderers,
  ...utilityRenderers,
  ...widgetsRenderers,
};

export function renderElement(ctx: RendererCtx): ReactNode {
  const renderer = RENDERERS[ctx.el.type];
  if (!renderer) {
    return (
      <div {...ctx.baseProps}>
        <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">
          {ctx.el.icon} {ctx.el.name}
        </span>
        {ctx.el.props.content || ctx.el.props.title || ctx.el.name}
        {ctx.children}
      </div>
    );
  }
  return renderer(ctx);
}
