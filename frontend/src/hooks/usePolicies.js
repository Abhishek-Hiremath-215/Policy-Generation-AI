import { useState, useCallback } from 'react';
import { policyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { downloadBlob } from '../utils/helpers';

export const usePolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);

  const generatePolicy = async (data) => {
    try {
      const response = await policyAPI.generate(data);
      setPolicies((prev) => [...prev, response.data]);
      toast.success('Policy generation started');
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate policy');
      throw err;
    }
  };

  const checkPolicyStatus = async (policyId) => {
    try {
      const response = await policyAPI.getStatus(policyId);
      return response.data;
    } catch (err) {
      console.error('Failed to check policy status:', err);
      return null;
    }
  };

  const downloadPolicy = async (policyId, filename) => {
    try {
      const response = await policyAPI.download(policyId);
      downloadBlob(response.data, filename || `policy_${policyId}.pdf`);
      toast.success('Policy downloaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to download policy');
      throw err;
    }
  };

  const deletePolicy = async (policyId) => {
    try {
      await policyAPI.delete(policyId);
      setPolicies((prev) => prev.filter((p) => p.id !== policyId));
      toast.success('Policy deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete policy');
      throw err;
    }
  };

  const fetchPoliciesByProject = useCallback(async (projectId) => {
    try {
      setLoading(true);
      const response = await policyAPI.getByProject(projectId);
      setPolicies(response.data);
    } catch (err) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    policies,
    loading,
    generatePolicy,
    checkPolicyStatus,
    downloadPolicy,
    deletePolicy,
    fetchPoliciesByProject,
  };
};
