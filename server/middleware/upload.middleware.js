const multer = require('multer');
const path = require('path'); // <-- Добавить

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Используем абсолютный путь
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Очищаем имя файла от потенциально проблемных символов
    const originalname = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Поддерживаются только изображения!'), false);
  }
};

module.exports = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10
  },
  fileFilter: fileFilter
});