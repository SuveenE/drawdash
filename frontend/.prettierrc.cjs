module.exports = {
  printWidth: 100,
  trailingComma: 'all',
  singleQuote: true,
  importOrder: [
    '^(next)|(next/(.*))$',
    '^(react)|(react/(.*))$',
    '<THIRD_PARTY_MODULES>',
    '^@/components/(.*)$',
    '^@/types/(.*)$',
    '^@/lib/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: false,
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
};
