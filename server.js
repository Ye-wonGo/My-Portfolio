const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary 환경 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dhqwbsnik',
  api_key: process.env.CLOUDINARY_API_KEY || '698974542396666',
  api_secret: process.env.CLOUDINARY_API_SECRET // 반드시 .env 파일이나 Render 환경변수에 추가해야 합니다.
});

// 기존의 디스크 스토리지 로직 대신 Cloudinary 스토리지 사용
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'avif', 'webp'],
  },
});

const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio_pdfs',
    format: 'pdf',
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 로컬 파일 업로드 제공 코드는 Cloudinary 사용으로 인해 제거됨

// 기본 API 라우트
app.get('/api', (req, res) => {
  res.json({ message: 'Backend is running successfully!' });
});

app.post('/api/upload', (req, res, next) => {
  imageUpload.array('images', 20)(req, res, (err) => {
    if (err) {
      console.error('Upload Error:', err);
      return res.status(500).json({ message: '이미지 업로드 중 서버 오류가 발생했습니다.', error: err.message });
    }
    next();
  });
}, (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const urls = files.map((file) => file.path);
  res.status(201).json({ urls });
});

app.post('/api/upload-pdf', (req, res, next) => {
  pdfUpload.single('pdf')(req, res, (err) => {
    if (err) {
      console.error('PDF Upload Error:', err);
      return res.status(500).json({ message: 'PDF 업로드 중 서버 오류가 발생했습니다.', error: err.message });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'PDF file is required' });
    return;
  }
  const url = req.file.path;
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
