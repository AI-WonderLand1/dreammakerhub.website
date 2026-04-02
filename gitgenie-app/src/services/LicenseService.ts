export async function validateLicense(key: string): Promise<boolean> {
  try {
    const response = await fetch('/api/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key }),
    });
    const result = await response.json();
    return result.valid;
  } catch (error) {
    console.error('License validation error:', error);
    return false;
  }
}
