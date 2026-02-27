const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model.weights',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.weights',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model.weights'
];

async function downloadFile(filename) {
    const fileUrl = baseUrl + filename;
    const destPath = path.join(modelsDir, filename);

    return new Promise((resolve, reject) => {
        console.log(`Downloading ${filename}...`);
        const file = fs.createWriteStream(destPath);
        https.get(fileUrl, function (response) {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', function () {
                file.close(resolve);
            });
        }).on('error', function (err) {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function main() {
    for (const file of files) {
        try {
            await downloadFile(file);
            console.log(`Successfully downloaded ${file}`);
        } catch (err) {
            console.error(err.message);
        }
    }
}

main();
