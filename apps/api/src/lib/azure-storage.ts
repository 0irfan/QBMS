import { BlobServiceClient, StorageSharedKeyCredential, ContainerClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Azure Storage configuration
const AZURE_ACCOUNT_NAME = process.env.AZURE_ACCOUNT_NAME || '';
const AZURE_ACCOUNT_KEY = process.env.AZURE_ACCOUNT_KEY || '';
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || 'qbms';
const AZURE_CONNECTION_STRING = process.env.AZURE_BLOB_CONNECTION_STRING || '';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

/**
 * Initialize Azure Blob Storage client
 */
export function initializeAzureStorage(): boolean {
  try {
    if (!AZURE_CONNECTION_STRING && (!AZURE_ACCOUNT_NAME || !AZURE_ACCOUNT_KEY)) {
      console.warn('Azure Blob Storage not configured. File uploads will be disabled.');
      return false;
    }

    // Use connection string if available, otherwise use account name and key
    if (AZURE_CONNECTION_STRING) {
      blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
    } else {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        AZURE_ACCOUNT_NAME,
        AZURE_ACCOUNT_KEY
      );
      blobServiceClient = new BlobServiceClient(
        `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net`,
        sharedKeyCredential
      );
    }

    containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
    
    console.log('✅ Azure Blob Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Azure Blob Storage:', error);
    return false;
  }
}

/**
 * Ensure container exists (create if not)
 */
export async function ensureContainerExists(): Promise<boolean> {
  try {
    if (!containerClient) {
      console.error('Container client not initialized');
      return false;
    }

    const exists = await containerClient.exists();
    if (!exists) {
      console.log(`Creating container: ${AZURE_CONTAINER_NAME}`);
      await containerClient.create({
        access: 'blob', // Public read access for blobs
      });
      console.log(`✅ Container created: ${AZURE_CONTAINER_NAME}`);
    }
    return true;
  } catch (error: any) {
    // Handle crypto error gracefully - this is a known issue with Azure SDK in some Node environments
    if (error?.message?.includes('crypto is not defined')) {
      console.error('Azure SDK crypto error - disabling Azure storage. Using local storage fallback.');
      blobServiceClient = null;
      containerClient = null;
      return false;
    }
    console.error('Failed to ensure container exists:', error);
    return false;
  }
}

/**
 * Upload file buffer to Azure Blob Storage
 */
export async function uploadToAzure(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<{ url: string; blobName: string }> {
  if (!containerClient) {
    throw new Error('Azure Blob Storage not initialized');
  }

  try {
    // Generate unique blob name
    const ext = path.extname(originalFilename) || '.jpg';
    const blobName = `${uuidv4()}${ext}`;
    
    // Get block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload buffer
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    // Get the URL
    const url = blockBlobClient.url;

    console.log(`✅ File uploaded to Azure: ${blobName}`);
    
    return { url, blobName };
  } catch (error) {
    console.error('Failed to upload to Azure:', error);
    throw new Error('Failed to upload file to Azure Blob Storage');
  }
}

/**
 * Delete file from Azure Blob Storage
 */
export async function deleteFromAzure(blobName: string): Promise<boolean> {
  if (!containerClient) {
    console.error('Azure Blob Storage not initialized');
    return false;
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
    console.log(`✅ File deleted from Azure: ${blobName}`);
    return true;
  } catch (error) {
    console.error('Failed to delete from Azure:', error);
    return false;
  }
}

/**
 * Get blob URL
 */
export function getBlobUrl(blobName: string): string {
  if (!AZURE_ACCOUNT_NAME) {
    throw new Error('Azure account name not configured');
  }
  return `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${AZURE_CONTAINER_NAME}/${blobName}`;
}

/**
 * Check if Azure Storage is configured
 */
export function isAzureStorageConfigured(): boolean {
  return blobServiceClient !== null && containerClient !== null;
}

/**
 * List all blobs in container (for admin purposes)
 */
export async function listBlobs(prefix?: string): Promise<string[]> {
  if (!containerClient) {
    throw new Error('Azure Blob Storage not initialized');
  }

  try {
    const blobs: string[] = [];
    const iterator = containerClient.listBlobsFlat({ prefix });
    
    for await (const blob of iterator) {
      blobs.push(blob.name);
    }
    
    return blobs;
  } catch (error) {
    console.error('Failed to list blobs:', error);
    throw new Error('Failed to list files from Azure Blob Storage');
  }
}

/**
 * Get blob metadata
 */
export async function getBlobMetadata(blobName: string): Promise<any> {
  if (!containerClient) {
    throw new Error('Azure Blob Storage not initialized');
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const properties = await blockBlobClient.getProperties();
    
    return {
      contentType: properties.contentType,
      contentLength: properties.contentLength,
      lastModified: properties.lastModified,
      metadata: properties.metadata,
    };
  } catch (error) {
    console.error('Failed to get blob metadata:', error);
    throw new Error('Failed to get file metadata');
  }
}
