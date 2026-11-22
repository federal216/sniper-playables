const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');

console.log('🚀 YouTube Playables Üretim Paketi (Production Build) Hazırlanıyor...\n');

// 1. dist klasörünü temizle/oluştur
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'audio'), { recursive: true });

// 2. Ses dosyalarını kopyala
const audioSrc = path.join(SRC_DIR, 'audio');
if (fs.existsSync(audioSrc)) {
    const files = fs.readdirSync(audioSrc);
    files.forEach(f => {
        fs.copyFileSync(path.join(audioSrc, f), path.join(DIST_DIR, 'audio', f));
    });
    console.log(`✅ ${files.length} ses dosyası dist/audio içine kopyalandı.`);
}

// 3. JS dosyalarını birleştir ve esbuild ile sıkıştır
console.log('⚡ JavaScript dosyaları (avatar.js, audio.js, data.js, engine.js, main.js) sıkıştırılıyor...');
const jsFiles = ['avatar.js', 'audio.js', 'data.js', 'engine.js', 'main.js'];
let combinedJs = '';
jsFiles.forEach(f => {
    combinedJs += fs.readFileSync(path.join(SRC_DIR, f), 'utf-8') + '\n';
});

const tempCombinedPath = path.join(DIST_DIR, 'temp_combined.js');
fs.writeFileSync(tempCombinedPath, combinedJs, 'utf-8');

const outJsPath = path.join(DIST_DIR, 'game.bundle.min.js');
execSync(`esbuild "${tempCombinedPath}" --minify --outfile="${outJsPath}"`, { stdio: 'inherit' });
fs.unlinkSync(tempCombinedPath);
console.log('✅ JS Bundle oluşturuldu: dist/game.bundle.min.js');

// 4. CSS dosyasını sıkıştır
console.log('🎨 CSS stilleri sıkıştırılıyor...');
const outCssPath = path.join(DIST_DIR, 'style.min.css');
execSync(`esbuild "${path.join(SRC_DIR, 'style.css')}" --minify --outfile="${outCssPath}"`, { stdio: 'inherit' });
console.log('✅ CSS sıkıştırıldı: dist/style.min.css');

// 5. Optimize edilmiş index.html oluştur
console.log('📄 Üretim index.html oluşturuluyor...');
let html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf-8');
html = html.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.min.css">');
const scriptBlockRegex = /<script src="avatar\.js"><\/script>[\s\S]*?<script src="main\.js"><\/script>/;
html = html.replace(scriptBlockRegex, '<script src="game.bundle.min.js"></script>');
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');
console.log('✅ index.html optimize edildi.');

// Boyut Özeti
function getDirSize(dir) {
    let size = 0;
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) size += getDirSize(full);
        else size += fs.statSync(full).size;
    });
    return size;
}

const totalSize = (getDirSize(DIST_DIR) / (1024 * 1024)).toFixed(2);
console.log(`\n🎉 TAMAMLANDI! Toplam YouTube Playables Paket Boyutu: ${totalSize} MB`);
console.log('📂 Çıktı Klasörü: ' + DIST_DIR);
