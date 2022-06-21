import fetch from 'node-fetch';
import fs from 'fs';
import { parseIiif } from '@allmaps/iiif-parser';

const PARALLELISM = 4;
const WAIT_MS = 100;

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
  
  const harvestOneBatch = async (startIdx = 0, parallelism = PARALLELISM) => {

    const nextBatch = Array.apply(null, Array(parallelism)).map((_, i) => {
      const idx = startIdx + i;

      if (idx >= images.length)
        return new Promise(resolve => resolve());

      const { label, fullImageUrl, format } = images[idx];

      const filename = `${imageDir}${pad(idx + 1, 5)}_${label}.${format}`;

      if (fs.existsSync(filename)) {
        console.log(`Skipping ${label} (${idx + 1}/${images.length}) - exists`);
        return new Promise(resolve => resolve());
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
          .catch(error => {
            console.error('Error downloading ' + fullImageUrl);
            console.log(error);

            return new Promise(resolve => resolve());
          });
      }
    });

    const responses = await Promise.all(nextBatch);

    if (startIdx + parallelism + 1 < images.length) {
      // Insert a small wait
      await new Promise(r => setTimeout(r, WAIT_MS));
      return harvestOneBatch(startIdx + parallelism, parallelism);
    } else if (startIdx + 1 < images.length) {
      await new Promise(r => setTimeout(r, 100));
      return harvestOneBatch(startIdx + parallelism, images.length - startIdx + 1);
    } else {
      console.log('Done!');
    }
  }

  return harvestOneBatch();
}
