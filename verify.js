const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== Проверка репозитория ===');

// 1. Проверка локальных файлов
const requiredFiles = [
  'package.json',
  'src/main.js',
  'amvera.yml',
  'Dockerfile'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '?' : '?'} ${file}`);
});

// 2. Проверка Git
try {
  console.log('\n=== Git статус ===');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.log('Незакоммиченные изменения:');
    console.log(status);
  } else {
    console.log('? Рабочая директория чиста');
  }
  
  // 3. Проверка последнего коммита
  const lastCommit = execSync('git log --oneline -1 --name-only', { encoding: 'utf8' });
  console.log('\n=== Последний коммит ===');
  console.log(lastCommit);
  
  // 4. Проверка наличия package.json в Git
  const inGit = execSync('git ls-files package.json', { encoding: 'utf8' });
  console.log('package.json в Git:', inGit.trim() ? '? Да' : '? Нет');
  
} catch(e) {
  console.log('Git ошибка:', e.message);
}
