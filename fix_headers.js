const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/frontend/src/pages');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find <header className="pageHeader"> block
  const headerRegex = /<header className="pageHeader">([\s\S]*?)<\/header>/;
  const match = content.match(headerRegex);
  
  if (match) {
    const headerContent = match[1];
    
    // Extract title from <h1>
    const h1Match = headerContent.match(/<h1>(.*?)<\/h1>/);
    const title = h1Match ? h1Match[1] : '';
    
    // Replace the block with <Header title="..." />
    content = content.replace(headerRegex, `<Header title="${title}" />`);
    
    // Add import if not exists
    if (!content.includes('import Header')) {
      // Find the last import
      const importRegex = /import\s+.*?;?\n/g;
      let lastImportIndex = 0;
      let importMatch;
      while ((importMatch = importRegex.exec(content)) !== null) {
        lastImportIndex = importMatch.index + importMatch[0].length;
      }
      
      const importStmt = `import Header from '../components/layout/Header/Header';\n`;
      if (lastImportIndex > 0) {
        content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
      } else {
        content = importStmt + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

processDir(pagesDir);
console.log('Done!');
