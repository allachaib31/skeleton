import fs from 'fs/promises';
import path from 'path';
import { HttpError } from '../../common/errors/HttpError';

export interface LanguageInfo {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
  isCustom: boolean;
  updatedAt?: string;
}

interface LanguageMetadata {
  languages: Record<string, Omit<LanguageInfo, 'code' | 'isDefault' | 'isCustom'>>;
}

interface UpsertLanguageInput {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  content: Buffer;
}

const sourceLocalesDir = path.resolve(process.cwd(), '../frontend/src/locales');
const storageLocalesDir = path.resolve(process.cwd(), 'storage/locales');
const metadataPath = path.join(storageLocalesDir, 'languages.json');

const builtInLanguages: LanguageInfo[] = [
  { code: 'en', name: 'English', direction: 'ltr', isDefault: true, isCustom: false },
  { code: 'fr', name: 'Français', direction: 'ltr', isDefault: false, isCustom: false },
  { code: 'ar', name: 'العربية', direction: 'rtl', isDefault: false, isCustom: false },
];

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(child, nextPrefix);
  });
};

const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as T;
};

const ensureStorage = async () => {
  await fs.mkdir(storageLocalesDir, { recursive: true });
};

const readMetadata = async (): Promise<LanguageMetadata> => {
  try {
    return await readJsonFile<LanguageMetadata>(metadataPath);
  } catch {
    return { languages: {} };
  }
};

const writeMetadata = async (metadata: LanguageMetadata) => {
  await ensureStorage();
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
};

const normalizeCode = (code: string) => code.trim().toLowerCase();

export class I18nService {
  static async listLanguages(): Promise<LanguageInfo[]> {
    const metadata = await readMetadata();
    const customLanguages = Object.entries(metadata.languages).map(([code, info]) => ({
      code,
      ...info,
      isDefault: false,
      isCustom: true,
    }));

    const customCodes = new Set(customLanguages.map((language) => language.code));
    return [
      ...builtInLanguages.filter((language) => !customCodes.has(language.code)),
      ...customLanguages,
    ];
  }

  static async getTemplate() {
    return readJsonFile<Record<string, unknown>>(path.join(sourceLocalesDir, 'en.json'));
  }

  static async getLanguage(code: string) {
    const normalizedCode = normalizeCode(code);
    const customPath = path.join(storageLocalesDir, `${normalizedCode}.json`);
    const sourcePath = path.join(sourceLocalesDir, `${normalizedCode}.json`);

    try {
      return await readJsonFile<Record<string, unknown>>(customPath);
    } catch {
      try {
        return await readJsonFile<Record<string, unknown>>(sourcePath);
      } catch {
        throw HttpError.notFound('i18n.not_found');
      }
    }
  }

  static async upsertLanguage(input: UpsertLanguageInput): Promise<LanguageInfo> {
    const code = normalizeCode(input.code);

    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(code)) {
      throw HttpError.badRequest('i18n.invalid_code');
    }

    if (!input.name.trim()) {
      throw HttpError.badRequest('i18n.name_required');
    }

    if (!['ltr', 'rtl'].includes(input.direction)) {
      throw HttpError.badRequest('i18n.invalid_direction');
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(input.content.toString('utf8'));
    } catch {
      throw HttpError.badRequest('i18n.invalid_json');
    }

    const template = await this.getTemplate();
    const templateKeys = new Set(flattenKeys(template));
    const uploadedKeys = new Set(flattenKeys(parsed));
    const missingKeys = [...templateKeys].filter((key) => !uploadedKeys.has(key));

    if (missingKeys.length > 0) {
      throw HttpError.badRequest('i18n.missing_keys');
    }

    await ensureStorage();
    await fs.writeFile(path.join(storageLocalesDir, `${code}.json`), JSON.stringify(parsed, null, 2));

    const metadata = await readMetadata();
    const updatedAt = new Date().toISOString();
    metadata.languages[code] = {
      name: input.name.trim(),
      direction: input.direction,
      updatedAt,
    };
    await writeMetadata(metadata);

    return {
      code,
      name: input.name.trim(),
      direction: input.direction,
      isDefault: false,
      isCustom: true,
      updatedAt,
    };
  }
}
