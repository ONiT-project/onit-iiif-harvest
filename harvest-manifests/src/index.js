import fetch from 'node-fetch';
import fs from 'fs';
import Papa from 'papaparse';

const WAIT_MS = 500;
const TARGET_DIR = '../data/manifests/D17/';

// const str = fs.readFileSync('../data/metadata/TravelogueD16_ALMAoutput_20210519_DG_2.csv', 'utf8');
const str = fs.readFileSync('../data/metadata/TravelogueD17_ALMAoutput_20210519_DG_2.csv', 'utf8');

const csv = Papa.parse(str, { header: true });

const barcodes = Array.from(new Set(csv.data.reduce((barcodes, row) => { 
  const cell = row.Barcode;
  
  if (cell) {
    const values = cell.split(';')
      .map(str => str.trim())
      .filter(str => str.startsWith('Z'));

    return [...barcodes, ...values ];
  } else {
    return barcodes;
  }
}, [])));

const harvestOne = async (idx = 0) => {
  const barcode = barcodes[idx];

  const filename = `${TARGET_DIR}${barcode}.manifest.json`;

  let wait;

  if (fs.existsSync(filename)) {
    console.log(`Skipping ${barcode} (${idx + 1}/${barcodes.length}) - exists`);
    wait = 0;
  } else {    
    console.log(`Harvesting ${barcode} (${idx + 1}/${barcodes.length})`);

    const url = `https://iiif.onb.ac.at/presentation/ABO/${barcode}/manifest`;

    const response = await fetch(url);
    const data = await response.json();

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    wait = WAIT_MS;
  }

  if ((idx + 1) < barcodes.length) {
    await new Promise(r => setTimeout(r, wait));
    harvestOne(idx + 1);
  } else {
    console.log('Done.');
  }
};

console.log(`Harvesting ${barcodes.length} barcodes`);
harvestOne();
