/**
 * Install Extension/Feature
 * - GitHub features are FREE
 * - Your custom features require payment
 */
import { logger } from "@lib/logger";

export type InstallResult = {
  success: boolean;
  message: string;
  extensionId?: string;
  requiresPayment?: boolean;
};

export async function purchaseExtension(
  extensionId: string,
  userId: string,
  source: 'github' | 'custom'
): Promise<InstallResult> {
  try {
    const response = await fetch('/api/features/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extensionId,
        userId,
        source,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Installation failed',
        requiresPayment: error.requiresPayment,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: source === 'github' 
        ? 'GitHub feature installed (included with subscription when applicable).' 
        : 'Custom feature installed (subscription required).',
      extensionId: data.extensionId,
    };
  } catch (error: any) {
    logger.error('Install error', { error });
    return {
      success: false,
      message: error.message || 'Failed to install feature',
    };
  }
}
