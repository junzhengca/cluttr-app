/**
 * ESLint Configuration
 * 
 * Key rules to prevent common mistakes:
 * 1. no-undef: Catches missing imports (e.g., using View without importing it from react-native)
 * 2. @typescript-eslint/no-use-before-define: Prevents using styled components before they're defined
 *    (e.g., AddCategoryButton = styled(CategoryButton) before CategoryButton is defined)
 */
module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    node: true,
  },
  rules: {
    // Prevent using undefined variables (catches missing imports like View)
    // Example error: "Property 'View' doesn't exist" when View is not imported
    'no-undef': 'error',
    
    // Disable base rule as it conflicts with TypeScript version
    'no-use-before-define': 'off',
    
    // Disable ban-types rule that doesn't exist in current version
    '@typescript-eslint/ban-types': 'off',
    
    // TypeScript-specific: prevent using variables before they're defined
    // This catches forward references in styled components (e.g., AddCategoryButton using CategoryButton before it's defined)
    '@typescript-eslint/no-use-before-define': ['error', {
      functions: false, // Allow function declarations to be hoisted
      classes: true,
      variables: true, // This will catch const/let used before definition (catches styled component forward references)
      typedefs: false, // TypeScript type definitions can be forward referenced
      enums: true,
      ignoreTypeReferences: false,
    }],
    
    // Ensure all imports are used
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    
    // Prevent accidental use of undefined
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Prevent implicit any types (catches untyped parameters in styled components)
    // Note: These rules require type information, so they only work on .ts/.tsx files
    '@typescript-eslint/no-unsafe-assignment': 'off', // Requires project config
    '@typescript-eslint/no-unsafe-member-access': 'off', // Requires project config
    '@typescript-eslint/no-unsafe-call': 'off', // Requires project config
    // Instead, rely on TypeScript's noImplicitAny (enabled via strict: true in tsconfig.json)
    
    // Ensure React is in scope when using JSX
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/jsx-uses-react': 'off', // Not needed in React 17+
    
    // Prevent duplicate imports from the same module
    'no-duplicate-imports': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

