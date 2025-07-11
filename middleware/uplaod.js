const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure folders exist
const ensureUploadFolders = () => {
  const folders = ['uploads', 'uploads/pdfs'];
  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
};
ensureUploadFolders();

// Storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const isPDF = file.fieldname === 'pdf';
    const uploadFolder = isPDF ? 'uploads/pdfs' : 'uploads';
    cb(null, uploadFolder);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});


const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (file.fieldname === 'pdf') {
    if (ext === '.pdf' && mime === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for the pdf field.'));
    }
  } else if (file.fieldname === 'image' || file.fieldname === 'images') {
    const imageTypes = /jpeg|jpg|png|gif/;
    if (imageTypes.test(ext) && imageTypes.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for image(s) fields.'));
    }
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}`));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter
});

module.exports = upload;
