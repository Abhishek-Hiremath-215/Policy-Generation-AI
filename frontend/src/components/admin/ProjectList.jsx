import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../icons/Icons';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatDate } from '../../utils/helpers';
import { useProjects } from '../../hooks/useProjects';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import FileUpload from './FileUpload';
import DataSourceList from './DataSourceList';

const ProjectList = ({ projects, loading, onRefresh, onProjectClick }) => {
  const { deleteProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent triggering the project click
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    setDeletingId(id);
    try {
      await deleteProject(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadClick = (project, e) => {
    e.stopPropagation(); // Prevent triggering the project click
    setSelectedProject(project);
    setShowUploadModal(true);
  };

  const handleSourcesClick = (project, e) => {
    e.stopPropagation(); // Prevent triggering the project click
    setSelectedProject(project);
    setShowSourcesModal(true);
  };

  const handleProjectClick = (project) => {
    if (onProjectClick) {
      onProjectClick(project);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Folder />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-4">Create your first project to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title="Projects" subtitle={`${projects.length} total projects`}>
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                      {project.name}
                    </h3>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                      {project.industry || 'General'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{project.company_name}</p>
                  
                  {project.description && (
                    <p className="text-sm text-gray-500 mb-3">{project.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Icons.Document />
                      <span>{project.documents_count || 0} documents</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icons.Database />
                      <span>{project.datasources_count || 0} sources</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icons.Clock />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icons.Upload />}
                    onClick={(e) => handleUploadClick(project, e)}
                  >
                    Upload
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icons.Database />}
                    onClick={(e) => handleSourcesClick(project, e)}
                  >
                    Sources
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Icons.Delete />}
                    onClick={(e) => handleDelete(project.id, e)}
                    loading={deletingId === project.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Upload Documents - ${selectedProject?.name}`}
        size="lg"
      >
        {selectedProject && (
          <FileUpload
            projectId={selectedProject.id}
            onSuccess={() => {
              setShowUploadModal(false);
              onRefresh();
            }}
          />
        )}
      </Modal>

      {/* Data Sources Modal */}
      <Modal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        title={`Data Sources - ${selectedProject?.name}`}
        size="xl"
      >
        {selectedProject && (
          <DataSourceList
            projectId={selectedProject.id}
            onClose={() => setShowSourcesModal(false)}
          />
        )}
      </Modal>
    </>
  );
};

export default ProjectList;
