import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { uploadToAzure, deleteFromAzure, isAzureStorageConfigured, listBlobs } from '../lib/azure-storage.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = /\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i;

// Create local upload directory if Azure is not configured
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for memory storage (we'll upload to Azure from memory)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.test(file.originalname)) {
      return cb(new Error('Only JPG, PNG, GIF, PDF, DOC, DOCX files are allowed'));
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();
uploadRouter.use(authMiddleware);
uploadRouter.use(requireRoles('super_admin', 'instructor'));

/**
 * Upload file - uses Azure Blob Storage if configured, otherwise local storage
 */
uploadRouter.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if Azure Storage is configured
    if (isAzureStorageConfigured()) {
      // Upload to Azure Blob Storage
      const { url, blobName } = await uploadToAzure(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.json({
        url,
        filename: blobName,
        storage: 'azure',
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } else {
      // Fallback to local storage
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      const url = `/uploads/${filename}`;
      return res.json({
        url,
        filename,
        storage: 'local',
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload file',
    });
  }
});

/**
 * Delete file - removes from Azure or local storage
 */
uploadRouter.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ error: 'Filename required' });
    }

    if (isAzureStorageConfigured()) {
      // Delete from Azure
      const deleted = await deleteFromAzure(filename);
      if (deleted) {
        return res.json({ message: 'File deleted successfully', storage: 'azure' });
      } else {
        return res.status(404).json({ error: 'File not found or already deleted' });
      }
    } else {
      // Delete from local storage
      const filepath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return res.json({ message: 'File deleted successfully', storage: 'local' });
      } else {
        return res.status(404).json({ error: 'File not found' });
      }
    }
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete file',
    });
  }
});

/**
 * List uploaded files (admin only)
 */
uploadRouter.get('/list', requireRoles('super_admin'), async (req, res) => {
  try {
    if (isAzureStorageConfigured()) {
      // List from Azure
      const blobs = await listBlobs();
      return res.json({
        files: blobs,
        storage: 'azure',
        count: blobs.length,
      });
    } else {
      // List from local storage
      const files = fs.readdirSync(UPLOAD_DIR);
      return res.json({
        files,
        storage: 'local',
        count: files.length,
      });
    }
  } catch (error) {
    console.error('List error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to list files',
    });
  }
});

/**
 * Get storage info
 */
uploadRouter.get('/info', async (req, res) => {
  res.json({
    storage: isAzureStorageConfigured() ? 'azure' : 'local',
    maxSize: MAX_SIZE,
    maxSizeMB: MAX_SIZE / (1024 * 1024),
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
  });
});

// Error handler for multer errors
uploadRouter.use((err: Error, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message.includes('Only')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});
