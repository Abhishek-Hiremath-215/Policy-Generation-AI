import React, { useState, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import FileUpload from './FileUpload';
import DataSourceList from './DataSourceList';
import { projectAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import Spinner from '../common/Spinner';
import toast from 'react-hot-toast';

const ProjectDetail = ({ project: initialProject, onBack, onRefresh }) => {
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjectDetails();
  }, [initialProject.id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getById(initialProject.id);
      setProject(response.data);
    } catch (error) {
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Icons.Info /> },
    { id: 'documents', label: 'Documents', icon: <Icons.Document /> },
    { id: 'sources', label: 'Data Sources', icon: <Icons.Database /> },
  ];

  if (loading && !project) {
    return <Spinner size="lg" className="py-20" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            icon={<Icons.Close />}
            onClick={onBack}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.company_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={<Icons.Upload />}
            onClick={() => setShowUploadModal(true)}
          >
            Upload Files
          </Button>
          <Button
            variant="outline"
            icon={<Icons.Database />}
            onClick={() => setShowSourcesModal(true)}
          >
            Add Source
          </Button>
          <Button
            icon={<Icons.Refresh />}
            onClick={fetchProjectDetails}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Project Information">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Name</label>
                  <p className="text-gray-900 mt-1">{project.company_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Industry</label>
                  <p className="text-gray-900 mt-1">{project.industry || 'Not specified'}</p>
                </div>
                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 mt-1">{project.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-gray-900 mt-1">{formatDate(project.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900 mt-1">{formatDate(project.updated_at)}</p>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  icon={<Icons.Upload />}
                  onClick={() => setShowUploadModal(true)}
                  className="justify-start"
                >
                  Upload Document
                </Button>
                <Button
                  variant="outline"
                  icon={<Icons.Database />}
                  onClick={() => setShowSourcesModal(true)}
                  className="justify-start"
                >
                  Add Database
                </Button>
                <Button
                  variant="outline"
                  icon={<Icons.Globe />}
                  onClick={() => setShowSourcesModal(true)}
                  className="justify-start"
                >
                  Add URL
                </Button>
                <Button
                  variant="outline"
                  icon={<Icons.Sparkles />}
                  onClick={() => window.location.href = '/user'}
                  className="justify-start"
                >
                  Generate Policy
                </Button>
              </div>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card title="Statistics">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                      <Icons.Document />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Documents</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {project.documents_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center">
                      <Icons.Database />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data Sources</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {project.datasources_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center">
                      <Icons.Sparkles />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Policies</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {project.policies_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Data Readiness">
              <div className="space-y-3">
                {project.documents_count > 0 || project.datasources_count > 0 ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <Icons.CheckCircle />
                      <span className="text-sm font-medium">Ready for policy generation</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      This project has sufficient data to generate comprehensive policies.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Icons.Warning />
                      <span className="text-sm font-medium">No data yet</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Upload documents or add data sources to start generating policies.
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <FileUpload
          projectId={project.id}
          onSuccess={fetchProjectDetails}
        />
      )}

      {activeTab === 'sources' && (
        <DataSourceList
          projectId={project.id}
          onClose={() => {}}
        />
      )}

      {/* Modals */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Documents"
        size="lg"
      >
        <FileUpload
          projectId={project.id}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchProjectDetails();
          }}
        />
      </Modal>

      <Modal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        title="Manage Data Sources"
        size="xl"
      >
        <DataSourceList
          projectId={project.id}
          onClose={() => {
            setShowSourcesModal(false);
            fetchProjectDetails();
          }}
        />
      </Modal>
    </div>
  );
};

export default ProjectDetail;
