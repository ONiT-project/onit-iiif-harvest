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
 * Harvests all plaintexts for the given manifest file
 */
export const harvestTexts = async (barcode, manifestPath, textDir) => {
  const str = fs.readFileSync(manifestPath, 'utf8');

  const sequences = parseIiif(JSON.parse(str)).sourceData.sequences;

  const texts = sequences[0].canvases.reduce((texts, canvas) => {
    const resources = 
      canvas.otherContent
        .map(c => c.resources)
        .reduce((flattened, resources) => {
          return [...flattened, ...resources ]
        }, [])
      .map(r => r.resource);

    const txtResources = resources
      .filter(r => r.format === 'text/plain')
      .map(r => ({
        ...r,
        label: canvas.label
      }));

    return [...texts, ...txtResources ];
  }, []);

  console.log(`Harvesting ${barcode} (${texts.length})`);
  
  const harvestOneBatch = async (startIdx = 0, parallelism = PARALLELISM) => {

    const nextBatch = Array.apply(null, Array(parallelism)).map((_, i) => {
      const idx = startIdx + i;

      if (idx >= texts.length)
        return new Promise(resolve => resolve());

      const { label } = texts[idx];
      const url = texts[idx]['@id'];

      const filename = `${textDir}${pad(idx + 1, 5)}_${label}.txt`;

      if (fs.existsSync(filename)) {
        console.log(`Skipping ${label} (${idx + 1}/${texts.length}) - exists`);
        return new Promise(resolve => resolve());
      } else {
        console.log(`Downloading ${label} (${idx + 1}/${texts.length})`);

        const controller = new AbortController()
        const signal = controller.signal
        setTimeout(() => { 
          controller.abort()
        }, 10000)

        return fetch(url, { signal })
          .then(response => new Promise(resolve => {
            const fileStream = fs.createWriteStream(filename + '.download');
            response.body.pipe(fileStream);
                
            response.body.on('error', err => {
              // Just log, keep going
              console.log('Error downloading ' + url);
              fs.unlinkSync(filename + '.download');
              
              resolve(err);
            });
            
            fileStream.on('finish', () => {
              fs.stat(filename + '.download', (err, stats) => {
                if (stats.size < 10) {
                  console.error('Error downloading ' + url);
                  fs.unlinkSync(filename + '.download');

                } else {
                  fs.renameSync(filename + '.download', filename);
                  console.log(`Wrote file ${filename}`);
                }
              });

              resolve();
            })
          }))
          .catch(error => {
            console.error('Error downloading ' + url);
            console.log(error);

            fs.unlinkSync(filename + '.download');

            return new Promise(resolve => resolve());
          });
      }
    });

    return Promise.all(nextBatch).then(async () => {
      if (startIdx + parallelism + 1 < texts.length) {
        // Insert a small wait
        await new Promise(r => setTimeout(r, WAIT_MS));
        return harvestOneBatch(startIdx + parallelism, parallelism);
      } else if (startIdx + 1 < texts.length) {
        await new Promise(r => setTimeout(r, 100));
        return harvestOneBatch(startIdx + parallelism, texts.length - startIdx + 1);
      } else {
        console.log('Done!');
      }  
    });
  }

  return harvestOneBatch();
}
