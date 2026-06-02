import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { Icons } from '../icons/Icons';
import { datasourceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const URLSourceForm = ({ projectId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateUrl(formData.url)) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);

    try {
      // Send only what the backend expects
      const payload = {
        name: formData.name,
        url: formData.url,
        config: {}
      };

      console.log('Sending payload:', payload);
      
      await datasourceAPI.addURL(projectId, payload);
      toast.success('URL source added successfully');
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error details:', error.response?.data);
      
      const errorDetail = error.response?.data?.detail;
      
      if (Array.isArray(errorDetail)) {
        const errorMessages = errorDetail.map(err => {
          const field = err.loc?.slice(-1)[0] || 'field';
          return `${field}: ${err.msg}`;
        }).join(', ');
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        toast.error(errorDetail || 'Failed to add URL source');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Source Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., Company Policy Page"
        required
      />

      <Input
        label="URL"
        name="url"
        type="text"
        value={formData.url}
        onChange={handleChange}
        placeholder="https://example.com/policies"
        required
        hint="Must start with http:// or https://"
      />

      {formData.url && validateUrl(formData.url) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            ✓ Valid URL - The system will scrape content from this page
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
        <Button 
          type="submit" 
          loading={loading} 
          disabled={!formData.name || !formData.url || loading}
          icon={<Icons.Globe />}
        >
          Add URL Source
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default URLSourceForm;
