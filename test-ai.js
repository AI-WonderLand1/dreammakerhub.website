import { assert } from 'console';

// Test importing the AI providers index
try {
  const providersModule = await import('./engine/core/ai/providers/index.ts');
  console.log('✅ Successfully imported AI providers index');
  console.log('Provider names:', Object.keys(providersModule.Providers));
} catch (err) {
  console.error('❌ Failed to import AI providers index:', err.message);
}

// Test importing runModel
try {
  const runModelModule = await import('./engine/core/ai/runModel.ts');
  console.log('✅ Successfully imported runModel');
} catch (err) {
  console.error('❌ Failed to import runModel:', err.message);
}

// Test importing types
try {
  const typesModule = await import('./engine/core/ai/types.ts');
  console.log('✅ Successfully imported AI types');
} catch (err) {
  console.error('❌ Failed to import AI types:', err.message);
}

// Test an API route
try {
  const apiRoute = await import('./apps/web/app/api/ai/route.ts');
  console.log('✅ Successfully imported AI route');
} catch (err) {
  console.error('❌ Failed to import AI route:', err.message);
}