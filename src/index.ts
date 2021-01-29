import { SSMClient } from "@aws-sdk/client-ssm";
import Mux, { PlaybackId } from '@mux/mux-node';
import pLimit from "p-limit";
import { extname, parse, resolve } from "path";
import { andThen, path, pick, pipe, prop, propEq, sortBy } from 'ramda';
import { downloadImage } from "./download";
import { getMuxCredentials } from "./getMuxCredentials";
import { needDownload } from "./needDownload";

const sortByWidth = sortBy(prop('width'));

export const keyPath = process.env.SSM_PATH;

if (!keyPath) {
  throw new Error('SSM_PATH not set');
}

const noDownload = process.env.NO_DOWNLOAD === 'true';

const baseDir = resolve(process.cwd(), process.env.OUTPUT_DIR || '.');

const limit = pLimit(5);

export const ssm = new SSMClient({ region: "ap-southeast-2" });

(async () => {
  const creds = await getMuxCredentials();

  const { Video } = new Mux(creds.id, creds.secret); // muxTokenId, muxTokenSecret

  const assets = await Video.Assets.list({ limit: 20 });

  let fileSize = 0;

  const downloads = [];

  for (const asset of assets) {
    console.log(`# Asset ${asset.id} (created_at: ${new Date(parseInt(asset.created_at, 10)*1000)}, mp4_support: ${asset.mp4_support}, static_renditions: ${asset.static_renditions?.status}, playback_ids: ${asset.playback_ids?.length})`);

    if (asset.mp4_support === 'none') {
      console.log(`# Setting ${asset.mp4_support} to standard...`);
      try {
        await Video.Assets.updateMp4Support(asset.id, { mp4_support: 'standard' });
        console.log('# Ok, done.');
      } catch (err) {
        console.log('# Something went wrong', err);
        console.log();
      }
    }

    if (asset.static_renditions?.status !== 'ready') {
      console.error('# Not ready');
      console.log();
      continue;
    }

    const files = sortByWidth(asset.static_renditions?.files ?? []);

    const probable = files[files.length - 1];

    const playback = (asset.playback_ids ?? []).find(propEq('policy', 'public'));   

    if (!probable) {
      console.log('# No file found yet');
      console.log();
      continue;
    }

    if (!playback) {
      console.log('# No playback ID. 🤷🏻‍♂️');
      console.log();
      continue;
    }

    console.log(`# size: ${probable.filesize}`);

    fileSize = fileSize + Number(probable.filesize);

    const src = `https://stream.mux.com/${playback.id}/${probable.name}`;
    console.log(`curl ${src} > ${playback.id}.${probable.ext}`);
    console.log();

    const dest = resolve(baseDir, `${playback.id}.${probable.ext}`);

    if (!noDownload && needDownload(dest, Number(probable.filesize))) {
      downloads.push(
        limit(() => dest) // downloadImage(src, dest))
      );
    }
  }

  console.log(`# total: ${fileSize}`);

  await Promise.all(downloads);

  console.log('Bye!');

})().catch((err) => console.error('oh', err));
