import { Playlist, SynthMood, Track } from '../types';

export interface AuraCloudDatabase {
  version: number;
  updatedAt: string;
  userEmail?: string;
  playlists: Playlist[];
  likedTrackIds: string[];
  customTracks: Array<Omit<Track, 'audioUrl'> & { driveFileId?: string; audioUrl?: string }>;
  equalizer: {
    gains: [number, number, number, number, number];
    activePreset: string;
    preAmp: number;
    stereoPan: number;
  };
  settings: {
    deckMode: string;
    visualizerMode: string;
    volume: number;
    lastTrackId?: string;
  };
}

const DATABASE_FOLDER_NAME = 'Aura Sound - Cloud Database';
const DATABASE_FILE_NAME = 'aura_music_database.json';

class DriveDatabaseService {
  private cachedFolderId: string | null = null;
  private cachedDatabaseFileId: string | null = null;

  /**
   * Finds or creates the dedicated Aura Sound folder in the user's Google Drive.
   */
  public async getOrCreateFolder(accessToken: string): Promise<string> {
    if (this.cachedFolderId) return this.cachedFolderId;

    try {
      // Search for folder
      const query = `name = '${DATABASE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!searchRes.ok) {
        throw new Error(`Drive search failed: ${searchRes.statusText}`);
      }

      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        this.cachedFolderId = searchData.files[0].id;
        return this.cachedFolderId!;
      }

      // Create folder if not found
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: DATABASE_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Aura Sound online music library and cloud storage',
        }),
      });

      if (!createRes.ok) {
        throw new Error(`Failed to create Drive folder: ${createRes.statusText}`);
      }

      const folderData = await createRes.json();
      this.cachedFolderId = folderData.id;
      return this.cachedFolderId!;
    } catch (err) {
      console.error('Error finding or creating Drive folder:', err);
      throw err;
    }
  }

  /**
   * Loads the Aura Sound database JSON from Google Drive.
   */
  public async loadDatabase(accessToken: string): Promise<{ data: AuraCloudDatabase; fileId: string } | null> {
    try {
      const folderId = await this.getOrCreateFolder(accessToken);

      // Search for database file inside folder
      const query = `name = '${DATABASE_FILE_NAME}' and '${folderId}' in parents and trashed = false`;
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!searchRes.ok) {
        throw new Error(`Search database file failed: ${searchRes.statusText}`);
      }

      const searchData = await searchRes.json();
      if (!searchData.files || searchData.files.length === 0) {
        return null;
      }

      const fileId = searchData.files[0].id;
      this.cachedDatabaseFileId = fileId;

      // Download file contents
      const fileRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!fileRes.ok) {
        throw new Error(`Failed to download database content: ${fileRes.statusText}`);
      }

      const data: AuraCloudDatabase = await fileRes.json();
      return { data, fileId };
    } catch (err) {
      console.error('Error loading database from Drive:', err);
      throw err;
    }
  }

  /**
   * Saves or updates the Aura Sound database JSON in Google Drive.
   */
  public async saveDatabase(accessToken: string, dbData: AuraCloudDatabase): Promise<string> {
    try {
      const folderId = await this.getOrCreateFolder(accessToken);
      const jsonContent = JSON.stringify(dbData, null, 2);

      if (this.cachedDatabaseFileId) {
        // Update existing file content
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${this.cachedDatabaseFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: jsonContent,
          }
        );

        if (updateRes.ok) {
          return this.cachedDatabaseFileId;
        }
      }

      // If no cached ID or update failed, create new multipart file in folder
      const metadata = {
        name: DATABASE_FILE_NAME,
        parents: [folderId],
        mimeType: 'application/json',
        description: 'Aura Sound persistent cloud database',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        jsonContent +
        closeDelimiter;

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!createRes.ok) {
        throw new Error(`Failed to save database file in Drive: ${createRes.statusText}`);
      }

      const result = await createRes.json();
      this.cachedDatabaseFileId = result.id;
      return result.id;
    } catch (err) {
      console.error('Error saving database to Drive:', err);
      throw err;
    }
  }

  /**
   * Uploads an audio binary file (MP3, WAV, FLAC, etc.) directly into the user's Drive folder.
   */
  public async uploadAudioFile(
    accessToken: string,
    file: File
  ): Promise<{ fileId: string; name: string }> {
    try {
      const folderId = await this.getOrCreateFolder(accessToken);

      const metadata = {
        name: file.name,
        parents: [folderId],
        mimeType: file.type || 'audio/mpeg',
        description: 'Aura Sound high-res audio track stored in Drive',
      };

      const boundary = '-------AuraAudioBoundary' + Date.now();
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      // Read file buffer
      const fileArrayBuffer = await file.arrayBuffer();
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' });
      const fileBlob = new Blob([fileArrayBuffer], { type: file.type || 'audio/mpeg' });

      const formData = new FormData();
      formData.append('metadata', metadataBlob);
      formData.append('file', fileBlob);

      // Upload using multipart
      const multipartRequestBody = new Blob([
        delimiter,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        metadataBlob,
        delimiter,
        `Content-Type: ${file.type || 'audio/mpeg'}\r\n\r\n`,
        fileBlob,
        closeDelimiter,
      ]);

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!uploadRes.ok) {
        throw new Error(`Drive audio upload failed: ${uploadRes.statusText}`);
      }

      const result = await uploadRes.json();
      return { fileId: result.id, name: result.name };
    } catch (err) {
      console.error('Error uploading audio file to Drive:', err);
      throw err;
    }
  }

  /**
   * Fetches an audio file from Google Drive as a playable Object URL.
   */
  public async fetchAudioBlobUrl(accessToken: string, fileId: string): Promise<string> {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch audio stream from Drive: ${res.statusText}`);
      }

      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Error fetching audio blob from Drive:', err);
      throw err;
    }
  }

  /**
   * Deletes a file from Google Drive.
   */
  public async deleteFile(accessToken: string, fileId: string): Promise<boolean> {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return res.ok;
    } catch (err) {
      console.error('Error deleting file from Drive:', err);
      return false;
    }
  }
}

export const driveDatabase = new DriveDatabaseService();
