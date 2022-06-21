import fs from 'fs';

import { harvestTexts } from "./texts.js";

const MANIFEST_FOLDER = '../data/manifests/D16/';
const TEXT_FOLDER = '../data/texts/D16/';

const files = fs.readdirSync(MANIFEST_FOLDER);

/**
 * Harvests plaintexts for one work.
 */
const harvestOneWork = async (idx = 0) => {
  const filename = files[idx];
  const barcode = filename.split('.')[0];

  // Plaintexts go into a sub-folder named after the barcode
  const textDir = `${TEXT_FOLDER}${barcode}/`; 
  if (!fs.existsSync(textDir))
    fs.mkdirSync(textDir);

  harvestTexts(barcode, `${MANIFEST_FOLDER}${filename}`, textDir).then(() => {
    if ((idx + 1) < files.length) {
      harvestOneWork(idx + 1);
    } else {
      console.log('Done');
    }
  });
}

harvestOneWork();
