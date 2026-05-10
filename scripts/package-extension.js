#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const edition = process.argv[2];

const commonFiles = [
  'manifest.json',
  'background.js',
  'script.js',
  'sidepanel.html',
  'jszip.min.js',
  'images',
  'LICENSE',
];

const specs = {
  store: {
    stageName: 'subbatch-store',
    zipName: 'subbatch-store.zip',
    config: {
      edition: 'store',
      enableAudioTranscription: false,
    },
    files: commonFiles,
  },
  local: {
    stageName: 'subbatch-local-enhanced',
    zipName: 'subbatch-local-enhanced.zip',
    config: {
      edition: 'local',
      enableAudioTranscription: true,
    },
    files: [...commonFiles, 'offscreen.html', 'libs', 'models'],
  },
};

if (!specs[edition]) {
  console.error('Usage: node scripts/package-extension.js <store|local>');
  process.exit(1);
}

const spec = specs[edition];
const stageDir = path.join(distDir, spec.stageName);
const zipPath = path.join(distDir, spec.zipName);

function ensureZipCli() {
  const result = spawnSync('zip', ['-v'], { encoding: 'utf8' });
  if (result.error) {
    throw new Error('未找到 zip 命令，请先安装系统 zip 工具后重试');
  }
}

function shouldCopyFile(sourcePath) {
  const basename = path.basename(sourcePath);
  if (basename === '.DS_Store') return false;
  if (basename === 'Thumbs.db') return false;
  if (sourcePath.split(path.sep).includes('.cache')) return false;
  if (basename.endsWith('.lock')) return false;
  if (basename.endsWith('.incomplete')) return false;
  return true;
}

function copyEntry(relativePath) {
  const sourcePath = path.join(rootDir, relativePath);
  const targetPath = path.join(stageDir, relativePath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`打包文件不存在: ${relativePath}`);
  }

  fs.cpSync(sourcePath, targetPath, {
    recursive: true,
    filter: shouldCopyFile,
  });
}

function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
}

function withoutValues(values, valuesToRemove) {
  const removeSet = new Set(valuesToRemove);
  return values.filter((value) => !removeSet.has(value));
}

function createStoreManifest(manifest) {
  const storeManifest = JSON.parse(JSON.stringify(manifest));

  storeManifest.permissions = withoutValues(storeManifest.permissions || [], ['offscreen']);
  storeManifest.host_permissions = withoutValues(storeManifest.host_permissions || [], [
    'https://upos-sz-mirrorhw.bilivideo.com/*',
    'https://*.bilivideo.com/*',
    'https://cors-anywhere.herokuapp.com/*',
    'https://cdn.jsdelivr.net/*',
  ]);
  delete storeManifest.web_accessible_resources;
  delete storeManifest.content_security_policy;

  return storeManifest;
}

function createLocalManifest(manifest) {
  const localManifest = JSON.parse(JSON.stringify(manifest));

  localManifest.name = 'SubBatch 本地增强版';
  localManifest.description =
    'SubBatch 本地增强版：批量获取和导出 B 站视频字幕，并内置 Whisper 模型支持高质量本地音频转字幕。';

  return localManifest;
}

function writeGeneratedFiles() {
  const manifest = readManifest();
  const outputManifest = edition === 'store' ? createStoreManifest(manifest) : createLocalManifest(manifest);
  const configContent = `globalThis.SubBatchExtensionConfig = ${JSON.stringify(spec.config, null, 2)};\n`;

  fs.writeFileSync(path.join(stageDir, 'manifest.json'), `${JSON.stringify(outputManifest, null, 2)}\n`);
  fs.writeFileSync(path.join(stageDir, 'extension-config.js'), configContent);
}

function copyInstallGuide() {
  if (edition !== 'local') return;

  const guidePath = path.join(rootDir, 'docs', 'local-enhanced-install.md');
  if (!fs.existsSync(guidePath)) return;

  fs.copyFileSync(guidePath, path.join(distDir, 'subbatch-local-enhanced-install.md'));
}

function zipStage() {
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }

  const result = spawnSync('zip', ['-qr', zipPath, '.'], {
    cwd: stageDir,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'zip 打包失败');
  }
}

function main() {
  ensureZipCli();
  fs.mkdirSync(distDir, { recursive: true });
  fs.rmSync(stageDir, { recursive: true, force: true });
  fs.mkdirSync(stageDir, { recursive: true });

  for (const relativePath of spec.files) {
    copyEntry(relativePath);
  }

  writeGeneratedFiles();
  copyInstallGuide();
  zipStage();

  console.log(`已生成 ${edition} 版本:`);
  console.log(`- 解压目录: ${path.relative(rootDir, stageDir)}`);
  console.log(`- ZIP: ${path.relative(rootDir, zipPath)}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
