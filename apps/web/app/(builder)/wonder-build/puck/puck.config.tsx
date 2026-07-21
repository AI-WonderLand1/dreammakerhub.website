import React from "react";
import buildPuckConfig from "@/lib/puck-lite/registry";
import { logger } from '@/lib/logger';

export const config = buildPuckConfig();
export default config;
