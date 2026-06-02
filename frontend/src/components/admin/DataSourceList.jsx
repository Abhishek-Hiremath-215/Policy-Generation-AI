import React, { useState, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import DatabaseSourceForm from './DatabaseSourceForm';
import URLSourceForm from './URLSourceForm';
import { datasourceAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DataSourceList = ({ projectId, onClose }) => {
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDatabaseForm, setShowDatabaseForm] = useState(false);
  const [showURLForm, setShowURLForm] = useState(false);

  const fetchDatasources = async () => {
    try {
      setLoading(true);
      const response = await datasourceAPI.getByProject(projectId);
      setDatasources(response.data);
    } catch (error) {
      toast.error('Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasources();
  }, [projectId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this data source?')) return;

    try {
      await datasourceAPI.delete(id);
      toast.success('Data source deleted');
      fetchDatasources();
    } catch (error) {
      toast.error('Failed to delete data source');
    }
  };

  const handleResync = async (id) => {
    try {
      await datasourceAPI.resync(id);
      toast.success('Re-sync initiated');
      fetchDatasources();
    } catch (error) {
      toast.error('Failed to re-sync data source');
    }
  };

  if (loading) {
    return <Spinner size="lg" className="py-12" />;
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          icon={<Icons.Database />}
          onClick={() => setShowDatabaseForm(true)}
        >
          Add Database
        </Button>
        <Button
          variant="outline"
          icon={<Icons.Globe />}
          onClick={() => setShowURLForm(true)}
        >
          Add URL
        </Button>
      </div>

      {/* Data Sources List */}
      {datasources.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Database />
          </div>
          <p className="text-gray-600 mb-4">No data sources yet</p>
          <p className="text-sm text-gray-500">
            Add a database connection or URL to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {datasources.map((source) => (
            <div
              key={source.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    source.source_type === 'database'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {source.source_type === 'database' ? <Icons.Database /> : <Icons.Globe />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{source.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        source.status === 'active' ? 'bg-green-100 text-green-800' :
                        source.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {source.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {source.source_type === 'database' ? 'Database Connection' : source.url}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{source.chunks_count || 0} chunks</span>
                      {source.last_synced && (
                        <span>Last synced: {formatDate(source.last_synced)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icons.Refresh />}
                    onClick={() => handleResync(source.id)}
                  >
                    Resync
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icons.Delete />}
                    onClick={() => handleDelete(source.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Database Form Modal */}
      <Modal
        isOpen={showDatabaseForm}
        onClose={() => setShowDatabaseForm(false)}
        title="Add Database Source"
        size="lg"
      >
        <DatabaseSourceForm
          projectId={projectId}
          onSuccess={() => {
            setShowDatabaseForm(false);
            fetchDatasources();
          }}
          onCancel={() => setShowDatabaseForm(false)}
        />
      </Modal>

      {/* URL Form Modal */}
      <Modal
        isOpen={showURLForm}
        onClose={() => setShowURLForm(false)}
        title="Add URL Source"
      >
        <URLSourceForm
          projectId={projectId}
          onSuccess={() => {
            setShowURLForm(false);
            fetchDatasources();
          }}
          onCancel={() => setShowURLForm(false)}
        />
      </Modal>
    </div>
  );
};

export default DataSourceList;
