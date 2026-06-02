import React, { useState } from 'react';
import Input, { Textarea } from '../common/Input';
import Button from '../common/Button';
import { Icons } from '../icons/Icons';
import { datasourceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DatabaseSourceForm = ({ projectId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    connection_string: '',
    tables: '',
    query: '',
    limit_per_table: 1000,
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
      const config = {};
      
      if (formData.tables) {
        config.tables = formData.tables
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);
      }
      
      if (formData.query) {
        config.query = formData.query;
      }
      
      if (formData.limit_per_table) {
        config.limit_per_table = parseInt(formData.limit_per_table);
      }

      const payload = {
        name: formData.name,
        connection_string: formData.connection_string,
        config: config
      };

      console.log('Sending payload:', payload);

      await datasourceAPI.addDatabase(projectId, payload);
      toast.success('Database source added successfully');
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
        toast.error(errorDetail || 'Failed to add database source');
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
        placeholder="e.g., HR Database"
        required
      />

      <Input
        label="Connection String"
        name="connection_string"
        value={formData.connection_string}
        onChange={handleChange}
        placeholder="postgresql://user:password@localhost:5432/database"
        required
        hint="Format: postgresql://user:password@host:port/database"
      />

      <Input
        label="Tables (comma-separated)"
        name="tables"
        value={formData.tables}
        onChange={handleChange}
        placeholder="employees, departments, policies"
        hint="Leave empty to extract all tables"
      />

      <Textarea
        label="Custom SQL Query (optional)"
        name="query"
        value={formData.query}
        onChange={handleChange}
        placeholder="SELECT * FROM table WHERE condition"
        rows={4}
        hint="If provided, this query will be used instead of tables"
      />

      <Input
        label="Rows per Table Limit"
        name="limit_per_table"
        type="number"
        value={formData.limit_per_table}
        onChange={handleChange}
        min="1"
        max="10000"
      />

      <div className="flex items-center gap-3 pt-4">
        <Button 
          type="submit" 
          loading={loading} 
          disabled={!formData.name || !formData.connection_string || loading}
          icon={<Icons.Database />}
        >
          Add Database Source
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default DatabaseSourceForm;
