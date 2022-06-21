import fs from 'fs';

import { harvestImages } from "./images.js";

const MANIFEST_FOLDER = '../data/manifests/D17/';
const IMAGE_FOLDER = '../data/images/D17/'

const files = fs.readdirSync(MANIFEST_FOLDER);

/**
 * Harvests images for one work.
 */
const harvestOneWork = async (idx = 0) => {
  const filename = files[idx];
  const barcode = filename.split('.')[0];

  // Images go into a sub-folder named after the barcode
  const imageDir = `${IMAGE_FOLDER}${barcode}/`; 
  if (!fs.existsSync(imageDir))
    fs.mkdirSync(imageDir);

  harvestImages(barcode, `${MANIFEST_FOLDER}${filename}`, imageDir).then(() => {
    if ((idx + 1) < files.length) {
      harvestOneWork(idx + 1);
    } else {
      console.log('Done');
    }
  });
}

harvestOneWork();
