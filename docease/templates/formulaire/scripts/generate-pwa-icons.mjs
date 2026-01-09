// Script Node.js pour générer les icônes PWA
// Usage: node generate-pwa-icons.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'public', 'assets', 'img');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('📱 Génération des icônes PWA...');
console.log('');

// Vérifier si sharp est disponible
try {
  const { default: sharp } = await import('sharp');
  
  const sourceImage = path.join(assetsDir, 'docEase_HD.png');
  
  if (!fs.existsSync(sourceImage)) {
    console.error('❌ Image source non trouvée:', sourceImage);
    process.exit(1);
  }
  
  for (const size of sizes) {
    const outputFile = path.join(assetsDir, `icon-${size}x${size}.png`);
    
    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputFile);
    
    console.log(`  ✅ Créé: icon-${size}x${size}.png`);
  }
  
  console.log('');
  console.log('🎉 Icônes PWA générées avec succès!');
  
} catch (error) {
  console.log('⚠️  Sharp non installé. Installation en cours...');
  console.log('');
  console.log('Exécutez ces commandes:');
  console.log('  npm install sharp');
  console.log('  node scripts/generate-pwa-icons.mjs');
  console.log('');
  console.log('Ou utilisez un outil en ligne:');
  console.log('  1. Allez sur https://www.pwabuilder.com/imageGenerator');
  console.log('  2. Uploadez public/assets/img/FOmetaux_HD.png');
  console.log('  3. Téléchargez et extrayez les icônes dans public/assets/img/');
}
