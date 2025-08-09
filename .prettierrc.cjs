module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 100,
  trailingComma: 'es5',
  arrowParens: 'always',
  endOfLine: 'lf',
  bracketSpacing: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  plugins: [
    require.resolve('prettier-plugin-tailwindcss'),
    require.resolve('@ianvs/prettier-plugin-sort-imports')
  ],
  tailwindFunctions: ['cva', 'cn', 'clsx', 'twMerge'],
  importOrder: [
    '^react',
    '',
    '^@openzeppelin/',
    '',
    '^@/',
    '',
    '^\\.\\.\\.(?!/?$)',
    '',
    '^\\./(?=.*/)(?!/?$)',
    '',
    '^\\.$',
    '',
    '^\\.(?!/?$)',
    '',
    '^\\./?$',
    '',
    '^.+\\.s?css$'
  ]
};
