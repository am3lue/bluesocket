import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../docs');
const OUT_DIR = path.resolve(__dirname, '../docs-html');

const template = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        pre {
            background-color: #f6f8fa;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
            background-color: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
        }
        pre code {
            background-color: transparent;
            padding: 0;
        }
        a {
            color: #0366d6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        blockquote {
            border-left: 4px solid #dfe2e5;
            color: #6a737d;
            padding-left: 1rem;
            margin-left: 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1rem;
        }
        th, td {
            border: 1px solid #dfe2e5;
            padding: 0.5rem 1rem;
            text-align: left;
        }
        th {
            background-color: #f6f8fa;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

async function buildDocs() {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUT_DIR, { recursive: true });

    // Read all files in the docs directory
    const files = await fs.readdir(DOCS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(DOCS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Convert markdown to HTML
      const htmlContent = marked.parse(content);
      
      const title = file.replace('.md', '');
      const fullHtml = template(title, htmlContent);

      const outFileName = file.replace('.md', '.html');
      const outFilePath = path.join(OUT_DIR, outFileName);

      await fs.writeFile(outFilePath, fullHtml, 'utf-8');
      console.log(`Compiled: ${file} -> ${outFileName}`);
    }

    console.log('Documentation build complete!');
  } catch (error) {
    console.error('Error building docs:', error);
    process.exit(1);
  }
}

buildDocs();
