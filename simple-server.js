import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;
const UPLOAD_DIR = 'D:\\testFolder\\fileFolder';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.log(`Created upload directory: ${UPLOAD_DIR}`);
    } catch (err) {
        console.error(`Error creating directory ${UPLOAD_DIR}:`, err);
    }
}

app.use(cors());
app.use(express.json());

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
        cb(null, UPLOAD_DIR)
    },
    filename: function (req, file, cb) {
        // Fix Korean filename encoding (latin1 -> utf8)
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/files', express.static(UPLOAD_DIR));

// Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        console.log(`File uploaded: ${req.file.originalname} to ${req.file.path}`);
        res.json({
            message: 'File uploaded successfully',
            filename: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send(error.message);
    }
});

// Delete Endpoint (Optional, for completeness)
app.delete('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`File deleted: ${filepath}`);
        res.json({ message: 'File deleted successfully' });
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Local Upload Server running on http://localhost:${PORT}`);
    console.log(`Upload Target: ${UPLOAD_DIR}`);
});
