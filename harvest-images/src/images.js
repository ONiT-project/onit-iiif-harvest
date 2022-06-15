import fetch from 'node-fetch';
import fs from 'fs';
import { parseIiif } from '@allmaps/iiif-parser';

const WAIT_MS = 300;

const pad = (num, size) => {
  let str = num.toString();
  while (str.length < size) str = '0' + str;
  return str;
}

/**
 * Harvests all images for the given manifest file
 */
export const harvestImages = async (barcode, manifestPath, imageDir) => {
  const str = fs.readFileSync(manifestPath, 'utf8');

  const { images } = parseIiif(JSON.parse(str));

  console.log(`Harvesting ${barcode} (${images.length})`);
  
  const harvestOne = (idx = 0) => {
    const { label, fullImageUrl, format } = images[idx];

    const filename = `${imageDir}${pad(idx + 1, 5)}_${label}.${format}`;

    if (fs.existsSync(filename)) {
      console.log(`Skipping ${label} (${idx + 1}/${images.length}) - exists`);
      
      if ((idx + 1) < images.length)
        return harvestOne(idx + 1);
    } else {
      console.log(`Downloading ${label} (${idx + 1}/${images.length})`);

      const controller = new AbortController()
      const signal = controller.signal
      setTimeout(() => { 
        controller.abort()
      }, 10000)

      return fetch(fullImageUrl, { signal })
        .then(response => new Promise(resolve => {
          const fileStream = fs.createWriteStream(filename + '.download');
          response.body.pipe(fileStream);
              
          response.body.on('error', err => {
            // Just log, keep going
            console.log('Error downloading ' + fullImageUrl);
            resolve(err);
          });
          
          fileStream.on('finish', () => {
            fs.stat(filename + '.download', (err, stats) => {
              if (stats.size < 1000) {
                console.error('Error downloading ' + fullImageUrl);
              } else {
                fs.renameSync(filename + '.download', filename);
                console.log(`Wrote file ${filename}`);
              }
            });

            resolve();
          })
        }))
        .then(() => {
          if ((idx + 1) < images.length)
            return new Promise(r => setTimeout(r, WAIT_MS))
              .then(() => harvestOne(idx + 1));
        })
        .catch(error => {
          console.error('Error downloading ' + fullImageUrl);
          console.log(error);

          if ((idx + 1) < images.length)
            return new Promise(r => setTimeout(r, WAIT_MS))
              .then(() => harvestOne(idx + 1));
        })
    }
  }

  return harvestOne();
}
