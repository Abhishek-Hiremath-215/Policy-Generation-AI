import React, { useState } from 'react';
import { Icons } from '../components/icons/Icons';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import ProjectList from '../components/admin/ProjectList';
import ProjectForm from '../components/admin/ProjectForm';
import ProjectDetail from '../components/admin/ProjectDetail';
import { useProjects } from '../hooks/useProjects';

const AdminDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { projects, loading, createProject, refetch } = useProjects();

  const handleCreateProject = async (data) => {
    await createProject(data);
    setShowCreateModal(false);
    refetch();
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    refetch();
  };

  // Show project detail view if a project is selected
  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={handleBackToList}
        onRefresh={refetch}
      />
    );
  }

  // Show main dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage projects, documents, and data sources
          </p>
        </div>
        <Button
          icon={<Icons.Plus />}
          onClick={() => setShowCreateModal(true)}
        >
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {projects.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
              <Icons.Folder />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {projects.reduce((acc, p) => acc + (p.documents_count || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Icons.Document />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data Sources</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {projects.reduce((acc, p) => acc + (p.datasources_count || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Icons.Database />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Policies Generated</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {projects.reduce((acc, p) => acc + (p.policies_count || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Icons.Sparkles />
            </div>
          </div>
        </Card>
      </div>

      {/* Projects List */}
      <ProjectList
        projects={projects}
        loading={loading}
        onRefresh={refetch}
        onProjectClick={handleProjectClick}
      />

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        size="lg"
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
