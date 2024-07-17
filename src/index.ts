import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

const args: string[] = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: ts-node index.ts <videoFolder> <thumbnailFolder>');
  process.exit(1);
}

const videoFolder: string = path.resolve(args[0]);
const thumbnailFolder: string = path.resolve(args[1]);

let ffmpegPath: string;
let ffprobePath: string;

try {
  ffmpegPath = execSync('which ffmpeg').toString().trim();
  ffprobePath = execSync('which ffprobe').toString().trim();
} catch (error) {
  console.error('ffmpeg or ffprobe is not installed or not found in PATH.');
  process.exit(1);
}

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

if (!fs.existsSync(thumbnailFolder)) {
  fs.mkdirSync(thumbnailFolder);
}

fs.readdir(videoFolder, (err, files) => {
  if (err) {
    console.error('Error reading video folder:', err);
    return;
  }

  const mp4Files: string[] = files.filter(file => path.extname(file).toLowerCase() === '.mp4');

  mp4Files.forEach(file => {
    const filePath: string = path.join(videoFolder, file);
    const sanitizedFileName: string = path.basename(file, '.mp4')
    ffmpeg(filePath)
      .inputOptions(['-analyzeduration', '2147483647', '-probesize', '2147483647'])
      .outputOptions(['-loglevel', 'debug'])
      .on('start', commandLine => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('stderr', stderrLine => {
        console.log('Stderr output: ' + stderrLine);
      })
      .screenshots({
        timestamps: ['0%'],
        filename: `${sanitizedFileName}.png`,
        folder: thumbnailFolder,
        size: '1920x1080'
      })
      .on('end', () => {
        console.log(`Thumbnail created for ${file}`);
      })
      .on('error', (err) => {
        console.error(`Error creating thumbnail for ${file}:`, err);
      });
  });
});
