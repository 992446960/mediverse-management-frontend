/** @type {import('lint-staged').Config} */
const GENERATED_DTS = /(?:^|\/)components\.d\.ts$|(?:^|\/)auto-imports\.d\.ts$/

/** @param {string[]} files */
function excludeGenerated(files) {
  return files.filter((file) => !GENERATED_DTS.test(file))
}

module.exports = {
  '*.{js,ts,vue}': (files) => {
    const filtered = excludeGenerated(files)
    if (filtered.length === 0) {
      return []
    }
    const paths = filtered.map((file) => `"${file}"`).join(' ')
    return [`eslint --fix ${paths}`, `prettier --write ${paths}`]
  },
}
