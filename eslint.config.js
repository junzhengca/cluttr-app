/**
 * ESLint Configuration (flat config, ESLint 9)
 *
 * Key rules to prevent common mistakes:
 * 1. no-undef: Catches missing imports (e.g., using View without importing it from react-native)
 * 2. @typescript-eslint/no-use-before-define: Prevents using styled components before they're defined
 *    (e.g., AddCategoryButton = styled(CategoryButton) before CategoryButton is defined)
 */
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/',
      '.expo/',
      '.expo-shared/',
      '.harness/',
      'dist/',
      'build/',
      '*.config.js',
      'coverage/',
      '*.log',
    ],
  },
  ...expoConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Prevent using undefined variables (catches missing imports like View)
      // Example error: "Property 'View' doesn't exist" when View is not imported
      'no-undef': 'error',

      // Ensure React is in scope when using JSX
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/jsx-uses-react': 'off', // Not needed in React 17+

      // React Hooks: ensure all dependencies are listed (ERROR to prevent future bugs)
      'react-hooks/exhaustive-deps': 'error',

      // New React-Compiler-era rules from eslint-plugin-react-hooks v7: they
      // flag long-standing patterns in this codebase (Reanimated shared-value
      // mutation in gesture worklets, intentional setState-in-effect sync).
      // Disabled to keep the pre-v7 lint contract; revisit with React Compiler.
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',

      // Disable prop-types validation (TypeScript handles this better)
      'react/prop-types': 'off', // TypeScript provides type checking, prop-types is redundant

      // Prevent duplicate imports from the same module
      'no-duplicate-imports': 'error',

      // styled-components' default export is also a named export; importing it
      // as `styled` is the documented usage, so this warning is pure noise.
      'import/no-named-as-default': 'off',

      // Prevent implicit any in styled-components template literals
      // This catches patterns like ${({ theme, isSelected }) => ...} without type annotations
      // Only matches ObjectPattern parameters that don't have a type annotation
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'TemplateLiteral[expressions.length>0] > ArrowFunctionExpression > ObjectPattern:not([typeAnnotation])',
          message:
            'Destructured parameters in template literals must have explicit types. Use StyledProps or StyledPropsWith<T>. Example: ({ theme }: StyledProps) => or ({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Disable base rule as it conflicts with TypeScript version
      'no-use-before-define': 'off',

      // TypeScript-specific: prevent using variables before they're defined
      // This catches forward references in styled components (e.g., AddCategoryButton using CategoryButton before it's defined)
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: false, // Allow function declarations to be hoisted
          classes: true,
          variables: true, // This will catch const/let used before definition (catches styled component forward references)
          typedefs: false, // TypeScript type definitions can be forward referenced
          enums: true,
          ignoreTypeReferences: false,
        },
      ],

      // Ensure all imports are used (ERROR to prevent future violations)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Prevent accidental use of undefined
      '@typescript-eslint/no-explicit-any': 'error',

      // Too strict for styled-components, TypeScript compiler catches implicit any
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/__tests__/**/*.ts',
      '**/*.spec.tsx',
      '**/*.test.tsx',
      'jest.setup.js',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);
