# Azure Blob Storage Integration Guide

Complete guide for using Azure Blob Storage with QBMS for file uploads.

## Overview

QBMS supports Azure Blob Storage for storing uploaded files (images, documents, etc.). This provides:
- **Scalable storage** - No local disk space limitations
- **High availability** - Azure's 99.9% uptime SLA
- **CDN integration** - Fast file delivery worldwide
- **Security** - Encrypted storage and access control
- **Cost-effective** - Pay only for what you use

## Configuration

### 1. Azure Storage Account Setup

#### Create Storage Account (Azure Portal)

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Storage account"
3. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or use existing
   - **Storage account name**: `devstorageazure` (must be globally unique)
   - **Region**: Choose closest to your users
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage) for dev, GRS for production
4. Click "Review + Create" → "Create"

#### Get Access Keys

1. Go to your storage account
2. Navigate to "Security + networking" → "Access keys"
3. Copy:
   - **Storage account name**: `devstorageazure`
   - **Key1** or **Key2**: Your account key
   - **Connection string**: Full connection string

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Azure Blob Storage Configuration
AZURE_ACCOUNT_NAME=your-azure-account-name
AZURE_ACCOUNT_KEY=your-azure-account-key
AZURE_BLOB_CONNECTION_STRING=your-azure-connection-string
AZURE_CONTAINER_NAME=qbms
```

**Note**: You can use either:
- `AZURE_BLOB_CONNECTION_STRING` (recommended - easier)
- OR `AZURE_ACCOUNT_NAME` + `AZURE_ACCOUNT_KEY`

### 3. Container Configuration

The container will be created automatically on first startup with:
- **Name**: `qbms` (configurable via `AZURE_CONTAINER_NAME`)
- **Access level**: Blob (public read access for files)

To use a different access level, modify `apps/api/src/lib/azure-storage.ts`:

```typescript
await containerClient.create({
  access: 'private', // Options: 'blob', 'container', 'private'
});
```

## Usage

### API Endpoints

#### Upload File

```bash
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

# Body
file: <file-data>
```

**Response:**
```json
{
  "url": "https://devstorageazure.blob.core.windows.net/qbms/abc123.jpg",
  "filename": "abc123.jpg",
  "storage": "azure",
  "size": 102400,
  "mimeType": "image/jpeg"
}
```

#### Delete File

```bash
DELETE /api/upload/:filename
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "File deleted successfully",
  "storage": "azure"
}
```

#### List Files (Admin Only)

```bash
GET /api/upload/list
Authorization: Bearer <token>
```

**Response:**
```json
{
  "files": ["abc123.jpg", "def456.png"],
  "storage": "azure",
  "count": 2
}
```

#### Get Storage Info

```bash
GET /api/upload/info
Authorization: Bearer <token>
```

**Response:**
```json
{
  "storage": "azure",
  "maxSize": 10485760,
  "maxSizeMB": 10,
  "allowedExtensions": ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"]
}
```

### Supported File Types

- **Images**: JPG, JPEG, PNG, GIF
- **Documents**: PDF, DOC, DOCX

Maximum file size: **10 MB**

### Frontend Integration

```typescript
// Upload file
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});

const data = await response.json();
console.log('File URL:', data.url);
```

## Fallback to Local Storage

If Azure Blob Storage is not configured, QBMS automatically falls back to local file storage:

- Files stored in: `./uploads` directory
- URLs: `/uploads/filename.jpg`
- Same API interface

This allows development without Azure credentials.

## Security

### Access Control

- **Upload**: Only instructors and super admins
- **Delete**: Only instructors and super admins
- **List**: Only super admins
- **Read**: Public (anyone with URL)

### Best Practices

1. **Use SAS tokens** for temporary access (future enhancement)
2. **Enable CORS** on Azure Storage for direct browser uploads
3. **Set up lifecycle policies** to auto-delete old files
4. **Enable soft delete** for recovery
5. **Use Azure CDN** for better performance

### CORS Configuration (Optional)

To allow direct browser uploads to Azure:

1. Go to Azure Portal → Storage Account
2. Navigate to "Settings" → "Resource sharing (CORS)"
3. Add rule for Blob service:
   - **Allowed origins**: `http://localhost:8080` or your domain
   - **Allowed methods**: GET, POST, PUT, DELETE
   - **Allowed headers**: `*`
   - **Exposed headers**: `*`
   - **Max age**: 3600

## Monitoring

### Azure Portal

1. Go to your storage account
2. Navigate to "Monitoring" → "Metrics"
3. View:
   - **Transactions**: Upload/download count
   - **Ingress/Egress**: Data transfer
   - **Availability**: Uptime percentage
   - **Latency**: Response times

### Logs

API logs show Azure operations:

```
✅ Azure Blob Storage initialized successfully
✅ Container created: qbms
✅ File uploaded to Azure: abc123.jpg
✅ File deleted from Azure: abc123.jpg
```

## Cost Estimation

### Azure Blob Storage Pricing (Approximate)

**Storage**:
- Hot tier: $0.018 per GB/month
- Cool tier: $0.01 per GB/month

**Operations**:
- Write: $0.05 per 10,000 operations
- Read: $0.004 per 10,000 operations

**Example** (1000 students, 100 MB average):
- Storage: 100 GB × $0.018 = $1.80/month
- Operations: ~10,000 reads/month = $0.004
- **Total**: ~$2/month

### Cost Optimization

1. **Use lifecycle policies** to move old files to cool/archive tier
2. **Enable compression** for documents
3. **Set up CDN** to reduce read operations
4. **Delete unused files** regularly

## Troubleshooting

### Connection Issues

**Error**: "Azure Blob Storage not initialized"

**Solutions**:
- Check environment variables are set correctly
- Verify account name and key are correct
- Ensure connection string format is valid
- Check network connectivity to Azure

### Upload Failures

**Error**: "Failed to upload file to Azure Blob Storage"

**Solutions**:
- Check file size (max 10 MB)
- Verify file type is allowed
- Ensure container exists
- Check Azure account has write permissions

### Container Not Found

**Error**: "Container not found"

**Solutions**:
- Container is created automatically on startup
- Check `AZURE_CONTAINER_NAME` environment variable
- Verify storage account has container creation permissions
- Manually create container in Azure Portal

### Access Denied

**Error**: "403 Forbidden"

**Solutions**:
- Verify account key is correct
- Check container access level (should be 'blob' for public read)
- Ensure storage account is not behind firewall
- Check CORS settings if accessing from browser

## Migration

### From Local to Azure

```bash
# 1. Upload existing files to Azure
node scripts/migrate-to-azure.js

# 2. Update database URLs
UPDATE questions SET image_url = REPLACE(image_url, '/uploads/', 'https://devstorageazure.blob.core.windows.net/qbms/');

# 3. Remove local files (after verification)
rm -rf uploads/*
```

### From Azure to Local

```bash
# 1. Download files from Azure
node scripts/migrate-from-azure.js

# 2. Update database URLs
UPDATE questions SET image_url = REPLACE(image_url, 'https://devstorageazure.blob.core.windows.net/qbms/', '/uploads/');

# 3. Disable Azure in .env
# AZURE_ACCOUNT_NAME=
# AZURE_ACCOUNT_KEY=
```

## Advanced Features

### Custom Metadata

Add metadata to uploaded files:

```typescript
await blockBlobClient.upload(buffer, buffer.length, {
  blobHTTPHeaders: {
    blobContentType: mimeType,
  },
  metadata: {
    uploadedBy: userId,
    originalName: filename,
    uploadDate: new Date().toISOString(),
  },
});
```

### Shared Access Signatures (SAS)

Generate temporary URLs with expiration:

```typescript
import { generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

const sasToken = generateBlobSASQueryParameters({
  containerName: 'qbms',
  blobName: 'abc123.jpg',
  permissions: BlobSASPermissions.parse('r'), // read only
  startsOn: new Date(),
  expiresOn: new Date(Date.now() + 3600 * 1000), // 1 hour
}, sharedKeyCredential).toString();

const sasUrl = `${blobUrl}?${sasToken}`;
```

### Lifecycle Management

Set up automatic deletion of old files:

1. Azure Portal → Storage Account → "Data management" → "Lifecycle management"
2. Add rule:
   - **Name**: Delete old uploads
   - **Blob type**: Block blobs
   - **Blob subtype**: Base blobs
   - **Filter**: Prefix = `qbms/`
   - **Action**: Delete blob after 90 days

## Support

For issues with Azure Blob Storage:

1. Check Azure Portal for service health
2. Review API logs for error messages
3. Verify environment variables
4. Test connection with Azure Storage Explorer
5. Contact Azure Support if needed

## References

- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [Azure Storage Pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)
- [Azure Storage Explorer](https://azure.microsoft.com/en-us/features/storage-explorer/)

---

*Last updated: [Current Date]*
