import { createWriteStream } from 'fs';
import Axios from 'axios';
import stream from 'stream';

export const downloadImage = async (src: string, dest: string) => {
  console.log('Connecting …')
  const { data, headers } = await Axios({
    url: src,
    method: 'GET',
    responseType: 'stream'
  })
  const totalLength = parseInt(headers['content-length'] as string, 10);

  let seen = 0;
  let lastEmit = Date.now();

  console.log(`${new Date()} ${dest} ${seen}/${totalLength} ${((seen/totalLength) * 100).toFixed(1)}%`);


  const writer = createWriteStream(dest);

  (data as stream).on('data', (chunk) => {
      seen += chunk.length;

      if (lastEmit < (Date.now() - 4000)) {
        lastEmit = Date.now();
        console.log(`${new Date()} ${dest} ${seen}/${totalLength} ${((seen/totalLength) * 100).toFixed(1)}%`);
      }
  });

  return new Promise((resolve, reject) => {
    data.pipe(writer);

    let error: Error;

    writer.on('error', err => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) {
        resolve(true);
      }
    });
  });
}
