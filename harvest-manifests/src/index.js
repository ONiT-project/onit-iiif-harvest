import fetch from 'node-fetch';
import fs from 'fs';
import Papa from 'papaparse';

const str = fs.readFileSync('../data/TravelogueD16_ALMAoutput_20210519_DG_2.csv', 'utf8');
// const str = fs.readFileSync('../data/TravelogueD17_ALMAoutput_20210519_DG_2.csv', 'utf8');

const csv = Papa.parse(str, { header: true });

console.log(csv);