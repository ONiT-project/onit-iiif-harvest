import fs from 'fs';

const BASE_FOLDER = '../data/clipped/D18/';

const folders = fs.readdirSync(BASE_FOLDER);

folders.forEach(folder => {

  const images = fs.readdirSync(`${BASE_FOLDER}${folder}`);
  images.forEach(image => {
    const srcName = `${BASE_FOLDER}${folder}/${image}`;
    const dstName = `${BASE_FOLDER}${folder}/${folder}_${image}`;

    console.log('renaming', srcName, 'to', dstName);
    fs.renameSync(srcName, dstName);
  });

});

