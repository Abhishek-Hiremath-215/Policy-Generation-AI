import React, { useState, useRef } from 'react';
import { Icons } from '../icons/Icons';
import Button from '../common/Button';
import ProgressBar from '../common/ProgressBar';
import { useDocuments } from '../../hooks/useDocuments';
import { formatBytes, getFileIcon } from '../../utils/helpers';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../../utils/constants';

const FileUpload = ({ projectId, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadDocument, documents } = useDocuments(projectId);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await uploadDocument(selectedFile, (progress) => {
        setUploadProgress(progress);
      });
      
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={ALLOWED_FILE_TYPES}
          className="hidden"
          id="file-upload"
        />
        
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <Icons.Upload />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-1">
            Choose a file to upload
          </p>
          <p className="text-sm text-gray-500 mb-2">
            or drag and drop it here
          </p>
          <p className="text-xs text-gray-400">
            Supported: PDF, DOCX, CSV, Excel, JSON (Max {formatBytes(MAX_FILE_SIZE)})
          </p>
        </label>
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{getFileIcon(selectedFile.type)}</div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-600"
              disabled={uploading}
            >
              <Icons.XCircle />
            </button>
          </div>

          {uploading && (
            <ProgressBar progress={uploadProgress} className="mb-3" />
          )}

          <Button
            onClick={handleUpload}
            loading={uploading}
            disabled={uploading}
            icon={<Icons.Upload />}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      )}

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Documents ({documents.length})
          </h3>
          <div className="space-y-2">
            {documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getFileIcon(doc.file_type)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-xs text-gray-500">
                      {doc.text_chunks_count} chunks • {doc.status}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                  doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  doc.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
