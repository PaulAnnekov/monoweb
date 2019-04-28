module.exports = {
  lexers: {
    ts: ['TypescriptLexer'],
    tsx: ['TypescriptLexer'],
  },
  createOldCatalogs: false,
  locales: ['ru'],
  output: 'src/locales/$LOCALE.json',
  input: ['src/**/*.{ts,tsx}'],
  sort: true,
}
