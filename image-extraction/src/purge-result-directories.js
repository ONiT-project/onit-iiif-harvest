/**
 * Helper that goes through all result folders and removes images that don't
 * have any annotations.
 */
import fs from 'fs';
 
const DETECTIONS_FOLDER = '../data/detections/D19/';
 
const folders = fs.readdirSync(DETECTIONS_FOLDER);

folders.forEach(folder => {
  const filename = `${DETECTIONS_FOLDER}${folder}/metadata.json`;

  if (fs.existsSync(filename)) {
    const str = fs.readFileSync(`${DETECTIONS_FOLDER}${folder}/metadata.json`, 'utf8');
    const metadata = JSON.parse(str);

    const totalImages = metadata.length;
    const imagesWithIllustration = metadata.filter(m => m.early_printed_illustrations.length > 0).length;

    console.log(`Purging ${folder}: ${totalImages} images, ${imagesWithIllustration} with illustrations`);

    metadata.forEach(record => {    
      const hasIllustrations = record.early_printed_illustrations.length > 0; 

      if (!hasIllustrations) {
        // Detections were in the 'images' folder - but we want to delete from 'detections'
        const detectionImage = record.filename.replace('data/images', 'data/detections');
        console.log('Deleting', detectionImage);
        try {
          fs.unlinkSync(detectionImage);
        } catch {
          //
        }
      }
    });
  } else {
    console.log(`metadata.json not found for ${folder} - deleting`);
    fs.rmSync(`${DETECTIONS_FOLDER}${folder}`, { recursive: true });
  }
});

