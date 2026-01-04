/**
 * Download Project as ZIP Utility
 * 
 * Recursively traverses the WebContainer file system and creates a downloadable ZIP file.
 * Excludes node_modules and .git directories.
 */

import JSZip from 'jszip';
import type { WebContainer, FileSystemTree, DirectoryNode, FileNode } from '@webcontainer/api';

// Directories to skip when creating the ZIP
const IGNORED_DIRECTORIES = ['node_modules', '.git', '.cache'];

/**
 * Recursively read all files from the WebContainer filesystem
 */
async function addDirectoryToZip(
    container: WebContainer,
    zip: JSZip,
    path: string = ''
): Promise<void> {
    const entries = await container.fs.readdir(path || '/', { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path ? `${path}/${entry.name}` : entry.name;

        // Skip ignored directories
        if (IGNORED_DIRECTORIES.includes(entry.name)) {
            console.log(`[ZIP] Skipping: ${fullPath}`);
            continue;
        }

        if (entry.isDirectory()) {
            // Create folder in zip and recurse
            zip.folder(fullPath);
            await addDirectoryToZip(container, zip, fullPath);
        } else if (entry.isFile()) {
            try {
                // Read file content and add to zip
                const content = await container.fs.readFile(fullPath, 'utf-8');
                zip.file(fullPath, content);
                console.log(`[ZIP] Added: ${fullPath}`);
            } catch (error) {
                // Handle binary files
                try {
                    const binaryContent = await container.fs.readFile(fullPath);
                    zip.file(fullPath, binaryContent);
                    console.log(`[ZIP] Added (binary): ${fullPath}`);
                } catch (err) {
                    console.warn(`[ZIP] Failed to read: ${fullPath}`, err);
                }
            }
        }
    }
}

/**
 * Download the entire WebContainer project as a ZIP file
 */
export async function downloadProjectAsZip(
    container: WebContainer | null,
    filename: string = 'project.zip'
): Promise<boolean> {
    if (!container) {
        console.error('[ZIP] No WebContainer instance available');
        return false;
    }

    try {
        console.log('[ZIP] Starting project export...');
        const zip = new JSZip();

        // Recursively add all files
        await addDirectoryToZip(container, zip, '');

        // Generate the ZIP blob
        console.log('[ZIP] Generating ZIP file...');
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('[ZIP] Download initiated!');
        return true;
    } catch (error) {
        console.error('[ZIP] Failed to create ZIP:', error);
        return false;
    }
}
