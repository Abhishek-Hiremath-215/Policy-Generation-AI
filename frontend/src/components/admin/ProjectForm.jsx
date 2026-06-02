import React, { useState } from 'react';
import Input, { Textarea } from '../common/Input';
import Button from '../common/Button';
import { Icons } from '../icons/Icons';

const ProjectForm = ({ project, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    company_name: project?.company_name || '',
    industry: project?.industry || '',
    description: project?.description || '',
    project_metadata: project?.project_metadata || {},
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Project Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter project name"
        required
      />

      <Input
        label="Company Name"
        name="company_name"
        value={formData.company_name}
        onChange={handleChange}
        placeholder="Enter company name"
        required
      />

      <Input
        label="Industry"
        name="industry"
        value={formData.industry}
        onChange={handleChange}
        placeholder="e.g., Technology, Healthcare, Finance"
      />

      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Brief description of the project"
        rows={4}
      />

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" loading={loading} icon={<Icons.CheckCircle />}>
          {project ? 'Update Project' : 'Create Project'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
