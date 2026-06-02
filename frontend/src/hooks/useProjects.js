import { useState, useEffect, useCallback } from 'react';
import { projectAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectAPI.getAll();
      setProjects(response.data);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (data) => {
    try {
      const response = await projectAPI.create(data);
      setProjects((prev) => [...prev, response.data]);
      toast.success('Project created successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create project');
      throw err;
    }
  };

  const updateProject = async (id, data) => {
    try {
      const response = await projectAPI.update(id, data);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? response.data : p))
      );
      toast.success('Project updated successfully');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id) => {
    try {
      await projectAPI.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete project');
      throw err;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

export const useProject = (projectId) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await projectAPI.getById(projectId);
      setProject(response.data);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading, error, refetch: fetchProject };
};
