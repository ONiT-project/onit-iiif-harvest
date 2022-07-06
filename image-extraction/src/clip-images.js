/**
 * Helper that goes through all detection results and creates separate 
 * clipped-out images.
 */
import fs from 'fs';
import { exec } from 'child_process';

const DETECTIONS_FOLDER = '../data/detections/D17/';
 
const folders = fs.readdirSync(DETECTIONS_FOLDER);

const pad = (num, size) => {
  let str = num.toString();
  while (str.length < size) str = '0' + str;
  return str;
}

folders.forEach(folder => {
  const str = fs.readFileSync(`${DETECTIONS_FOLDER}${folder}/metadata.json`, 'utf8');
  const metadata = JSON.parse(str);

  const imagesWithIllustration = metadata.filter(m => m.early_printed_illustrations.length > 0);

  if (imagesWithIllustration.length > 0) {
    console.log(`Clipping ${folder}: ${imagesWithIllustration.length} images with illustrations`);

    const destDir = `${DETECTIONS_FOLDER.replace('detections', 'clipped')}${folder}/`; 
    if (!fs.existsSync(destDir))
      fs.mkdirSync(destDir);
    
    imagesWithIllustration.forEach(record => {
      console.log(`Clipping ${record.early_printed_illustrations.length} images from ${record.filename}`);

      record.early_printed_illustrations.forEach((box, idx) => {
        const { x0, y0, x1, y1 } = box;

        const w = x1 - x0;
        const h = y1 - y0;

        const source = record.filename;
        const dest = source.replace('data/images', 'data/clipped').replace(/\.jpg$/, `_${pad(idx + 1, 2)}.jpg`);

        const cmd = `gm convert -crop ${w}x${h}+${x0}+${y0} ${source} ${dest}`;
        exec(cmd);
      });
    }); 

  }
});
