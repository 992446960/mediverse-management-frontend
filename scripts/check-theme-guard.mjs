#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const args = process.argv.slice(2)
const rootArgIndex = args.indexOf('--root')
const rootDir = resolve(rootArgIndex >= 0 ? args[rootArgIndex + 1] : process.cwd())
const srcDir = join(rootDir, 'src')

const styleSurfacePatterns = [
  {
    label: 'bare white background',
    pattern: /\bbackground(?:-color)?\s*:\s*(?:#fff(?:fff)?|white)\b/i,
  },
  {
    label: 'bare dark text',
    pattern: /\bcolor\s*:\s*(?:#111827|#000|#333|#1f2937|#374151)\b/i,
  },
]

const sourceSurfacePatterns = [
  {
    label: 'invalid css variable arbitrary color utility',
    pattern: /\b(?:bg|text|border)-\[(?:--color|--ant)-[^\]]+\]/i,
  },
  {
    label: 'global light markdown css import',
    pattern: /github-markdown-css\/github-markdown-light\.css/i,
  },
]

function listVueFiles(dir) {
  if (!existsSync(dir)) return []
  const files = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue
      files.push(...listVueFiles(fullPath))
    } else if (entry.endsWith('.vue')) {
      files.push(fullPath)
    }
  }
  return files
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length
}

function collectStyleBlocks(source) {
  const blocks = []
  const styleBlockPattern = /<style\b[^>]*>([\s\S]*?)<\/style>/gi
  let match
  while ((match = styleBlockPattern.exec(source))) {
    blocks.push({
      content: match[1],
      startLine: lineNumberAt(source, match.index + match[0].indexOf(match[1])),
    })
  }
  return blocks
}

function inspectFile(file) {
  const source = readFileSync(file, 'utf8')
  const issues = []
  const lines = source.split('\n')

  lines.forEach((line, index) => {
    if (line.includes('bg-white') && !line.includes('dark:') && !line.includes('var(')) {
      issues.push({
        line: index + 1,
        label: 'unpaired bg-white utility',
        text: line.trim(),
      })
    }

    for (const { label, pattern } of sourceSurfacePatterns) {
      if (pattern.test(line)) {
        issues.push({
          line: index + 1,
          label,
          text: line.trim(),
        })
      }
    }
  })

  for (const block of collectStyleBlocks(source)) {
    block.content.split('\n').forEach((line, index) => {
      if (line.includes('var(')) return
      for (const { label, pattern } of styleSurfacePatterns) {
        if (pattern.test(line)) {
          issues.push({
            line: block.startLine + index,
            label,
            text: line.trim(),
          })
        }
      }
    })
  }

  return issues
}

const failures = []
for (const file of listVueFiles(srcDir)) {
  const issues = inspectFile(file)
  for (const issue of issues) {
    failures.push(`${relative(rootDir, file)}:${issue.line}: ${issue.label}: ${issue.text}`)
  }
}

if (failures.length > 0) {
  console.error('theme guard failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('theme guard passed')
