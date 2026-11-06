import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cacheIndex = process.argv.indexOf('--cache-dir');
if (cacheIndex < 0 || !process.argv[cacheIndex + 1]) {
  throw new Error('Provide --cache-dir <absolute directory> for original source downloads.');
}
const cache = path.resolve(process.argv[cacheIndex + 1]);
const output = path.join(root, 'public', 'earth');
await fs.mkdir(cache, { recursive: true });
await fs.mkdir(output, { recursive: true });
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const sources = await Promise.all(
  ['daymap', 'nightmap', 'clouds'].map(async (kind) => {
    const file = `8k_earth_${kind}.jpg`;
    const url = `https://www.solarsystemscope.com/textures/download/${file}`;
    const cachedPath = path.join(cache, file);
    let data;
    try {
      data = await fs.readFile(cachedPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      data = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(cachedPath, data);
    }
    const metadata = await sharp(data).metadata();
    if (metadata.width !== metadata.height * 2 || metadata.width < 4096) {
      throw new Error(
        `Expected a high-resolution 2:1 Earth map, got ${file} ${metadata.width}x${metadata.height}`,
      );
    }
    return {
      kind,
      url,
      file,
      data,
      width: metadata.width,
      height: metadata.height,
      bytes: data.length,
      sha256: sha256(data),
    };
  }),
);

const variants = [];
for (const source of sources) {
  const label = source.kind === 'daymap' ? 'day' : source.kind === 'nightmap' ? 'night' : 'clouds';
  for (const width of [4096, 2048]) {
    const file = `earth-${label}-${width === 4096 ? '4k' : '2k'}.webp`;
    let pipeline = sharp(source.data).resize(width, width / 2, { kernel: 'lanczos3' });
    if (label === 'clouds') pipeline = pipeline.grayscale();
    const data = await pipeline
      .webp({ quality: label === 'night' ? 94 : label === 'clouds' ? 88 : 87, effort: 6 })
      .toBuffer();
    await fs.writeFile(path.join(output, file), data);
    variants.push({
      file,
      width,
      height: width / 2,
      bytes: data.length,
      sha256: sha256(data),
      source: source.file,
      colorSpace: label === 'clouds' ? 'non-color mask' : 'sRGB',
    });
  }
}
const manifest = {
  generatedAt: new Date().toISOString(),
  sourcePage: 'https://www.solarsystemscope.com/textures/',
  author: 'Solar System Scope / INOVE; based on NASA imagery',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  modifications: [
    'Lanczos resize',
    'WebP conversion/optimization',
    'Cloud map converted to a grayscale non-color opacity mask',
  ],
  sources: sources.map(({ data: _data, ...source }) => source),
  variants,
  optionalNormalMap:
    'Deferred: this static proof uses the surface/night/cloud set; add a renormalized normal map only if the reviewed appearance needs it.',
};
await fs.writeFile(
  path.join(output, 'asset-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
for (const profile of ['4k', '2k']) {
  const bytes = variants
    .filter((v) => v.file.includes(profile))
    .reduce((sum, v) => sum + v.bytes, 0);
  process.stdout.write(
    `${profile} textures: ${(bytes / 1_000_000).toFixed(2)} MB (poster will be added after rendering)\n`,
  );
}
