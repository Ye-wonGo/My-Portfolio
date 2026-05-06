const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
      return;
    }
    cb(new Error('Only PNG and JPG files are allowed'));
  },
});

const pdfUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed'));
  },
});

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// 기본 API 라우트
app.get('/api', (req, res) => {
  res.json({ message: 'Backend is running successfully!' });
});

app.post('/api/upload', imageUpload.array('images', 20), (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  // Render 환경변수(RENDER_EXTERNAL_URL) 우선 적용
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;
  const urls = files.map((file) => `${baseUrl}/uploads/${file.filename}`);
  res.status(201).json({ urls });
});

app.post('/api/upload-pdf', pdfUpload.single('pdf'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'PDF file is required' });
    return;
  }

  // Render 환경변수(RENDER_EXTERNAL_URL) 우선 적용
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

// 프로덕션 환경(배포용) - 클라이언트 정적 파일 제공
if (process.env.NODE_ENV === 'production') {
  // 백엔드 내의 dist 폴더의 정적 파일을 제공하도록 설정
  const buildPath = path.join(__dirname, 'dist');
  app.use(express.static(buildPath));

  // Express 5 호환을 위해 '*' 대신 '/*' 사용
  app.get('/*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
