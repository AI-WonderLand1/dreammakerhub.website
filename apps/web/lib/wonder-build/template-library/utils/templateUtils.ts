import { WonderBuildTemplate, ValidationResult } from '../types';

export function validateTemplatesJson(jsonInput: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalTemplates: 0,
      categoriesFound: [],
      variantCount: 0,
    },
  };

  let parsed: any;
  try {
    parsed = JSON.parse(jsonInput);
  } catch (err: any) {
    result.valid = false;
    result.errors.push(`JSON Syntax Error: ${err.message}`);
    return result;
  }

  if (!Array.isArray(parsed)) {
    result.valid = false;
    result.errors.push('Root structure must be a JSON array of template objects.');
    return result;
  }

  result.stats.totalTemplates = parsed.length;
  const categoriesSet = new Set<string>();
  const idSet = new Set<string>();
  const thumbnailSeeds = new Set<string>();

  parsed.forEach((tpl: any, idx: number) => {
    const tplNum = idx + 1;

    // Required fields check
    if (!tpl.id || typeof tpl.id !== 'string') {
      result.errors.push(`Template #${tplNum}: missing or invalid "id" field.`);
      result.valid = false;
    } else {
      if (idSet.has(tpl.id)) {
        result.errors.push(`Template #${tplNum}: Duplicate "id" found -> "${tpl.id}".`);
        result.valid = false;
      }
      idSet.add(tpl.id);

      if (!tpl.id.startsWith('template_')) {
        result.warnings.push(`Template #${tplNum}: ID "${tpl.id}" does not start with recommended prefix "template_".`);
      }
    }

    if (!tpl.name || typeof tpl.name !== 'string') {
      result.errors.push(`Template #${tplNum}: missing or invalid "name".`);
      result.valid = false;
    }

    if (!tpl.description || typeof tpl.description !== 'string') {
      result.errors.push(`Template #${tplNum}: missing or invalid "description".`);
      result.valid = false;
    }

    if (!tpl.category || typeof tpl.category !== 'string') {
      result.errors.push(`Template #${tplNum}: missing or invalid "category".`);
      result.valid = false;
    } else {
      categoriesSet.add(tpl.category);
    }

    if (!tpl.thumbnail || typeof tpl.thumbnail !== 'string') {
      result.errors.push(`Template #${tplNum}: missing or invalid "thumbnail" URL.`);
      result.valid = false;
    } else if (tpl.thumbnail.includes('picsum.photos/seed/')) {
      const match = tpl.thumbnail.match(/\/seed\/([^/]+)\//);
      if (match && match[1]) {
        const seed = match[1];
        if (thumbnailSeeds.has(seed)) {
          result.warnings.push(`Template #${tplNum}: Duplicate thumbnail seed "${seed}" detected.`);
        }
        thumbnailSeeds.add(seed);
      }
    }

    if (!Array.isArray(tpl.elements) || tpl.elements.length === 0) {
      result.errors.push(`Template #${tplNum}: "elements" must be a non-empty array.`);
      result.valid = false;
    } else if (tpl.elements.length < 4) {
      result.warnings.push(`Template #${tplNum}: Has only ${tpl.elements.length} top-level elements (recommended 4-6 sections).`);
    }

    if (tpl.variant) {
      result.stats.variantCount++;
    }
  });

  result.stats.categoriesFound = Array.from(categoriesSet);
  return result;
}

export function downloadJsonFile(data: any, filename: string = 'wonderbuild_templates.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '');
}
