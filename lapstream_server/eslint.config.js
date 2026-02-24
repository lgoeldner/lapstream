import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ["eslint.config.js", "drizzle.config.ts"],
                    defaultProject: "tsconfig.json",
                },
                tsconfigRootDir: import.meta.dirname,
                sourceType: "module",
            },
        }
    }
);
