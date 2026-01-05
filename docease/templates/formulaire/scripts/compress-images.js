/**
 * Script pour compresser les images du projet
 * Utilise sharp pour optimiser les images PNG et JPEG
 * 
 * Installation: npm install --save-dev sharp
 * Usage: node templates/formulaire/scripts/compress-images.js
 */

const fs = require('fs');
const path = require('path');

// Vérifier si sharp est installé
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ sharp n\'est pas installé. Installez-le avec: npm install --save-dev sharp');
  process.exit(1);
}

const IMAGES_DIR = path.join(__dirname, '../../../public/assets/img');
const OUTPUT_DIR = path.join(__dirname, '../../../public/assets/img/optimized');

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Configuration de compression
const COMPRESSION_CONFIG = {
  jpeg: {
    quality: 80,
    progressive: true,
    mozjpeg: true
  },
  png: {
    quality: 80,
    compressionLevel: 9,
    progressive: true
  },
  webp: {
    quality: 80,
    effort: 6
  }
};

/**
 * Compresser une image
 */
async function compressImage(inputPath, outputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`📸 Compression de ${path.basename(inputPath)} (${metadata.width}x${metadata.height})...`);
    
    // Compresser selon le format
    if (ext === '.jpg' || ext === '.jpeg') {
      await image
        .jpeg(COMPRESSION_CONFIG.jpeg)
        .toFile(outputPath);
    } else if (ext === '.png') {
      await image
        .png(COMPRESSION_CONFIG.png)
        .toFile(outputPath);
    } else {
      console.log(`⚠️  Format non supporté: ${ext}`);
      return;
    }
    
    // Créer aussi une version WebP (format moderne plus léger)
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    await sharp(inputPath)
      .webp(COMPRESSION_CONFIG.webp)
      .toFile(webpPath);
    
    // Comparer les tailles
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const webpSize = fs.statSync(webpPath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    const webpSavings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
    
    console.log(`  ✅ Original: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`  ✅ Compressé: ${(compressedSize / 1024).toFixed(1)}KB (${savings}% de réduction)`);
    console.log(`  ✅ WebP: ${(webpSize / 1024).toFixed(1)}KB (${webpSavings}% de réduction)`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la compression de ${path.basename(inputPath)}:`, error.message);
  }
}

/**
 * Compresser toutes les images d'un dossier
 */
async function compressAllImages() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Le dossier ${IMAGES_DIR} n'existe pas`);
    return;
  }
  
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });
  
  if (imageFiles.length === 0) {
    console.log('ℹ️  Aucune image à compresser');
    return;
  }
  
  console.log(`🚀 Compression de ${imageFiles.length} image(s)...\n`);
  
  for (const file of imageFiles) {
    const inputPath = path.join(IMAGES_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    await compressImage(inputPath, outputPath);
    console.log('');
  }
  
  console.log('✨ Compression terminée !');
  console.log(`📁 Images optimisées dans: ${OUTPUT_DIR}`);
  console.log('\n💡 Pour utiliser les images optimisées, remplacez les chemins dans votre code:');
  console.log('   /assets/img/image.png → /assets/img/optimized/image.webp');
}

// Exécuter
compressAllImages().catch(console.error);

