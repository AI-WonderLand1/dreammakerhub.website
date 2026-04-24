// MDX Components for Nextra 4
// This file provides the MDX components that Nextra expects
// It also re-exports useMDXComponents for the virtual import source

import { useMDXComponents as _provide } from '@mdx-js/react';
import type { MDXComponents } from 'mdx/types';

export const MDXComponents: MDXComponents = {};

export const useMDXComponents = _provide;
