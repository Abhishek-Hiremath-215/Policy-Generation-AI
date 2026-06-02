import { useState, useEffect, useCallback } from 'react';
import { documentAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useDocuments = (projectId) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await documentAPI.getByProject(projectId);
      setDocuments(response.data);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const uploadDocument = async (file, onProgress) => {
    try {
      const response = await documentAPI.upload(projectId, file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress && onProgress(progress);
      });
      
      setDocuments((prev) => [...prev, response.data.document]);
      toast.success(response.data.message);
      return response.data.document;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload document');
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      await documentAPI.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success('Document deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete document');
      throw err;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
};
