import React, { useEffect, useState } from 'react';
import { projectAPI } from '../../services/api';
import { Icons } from '../icons/Icons';
import Spinner from '../common/Spinner';
import toast from 'react-hot-toast';

const ProjectSelector = ({ onProjectSelect, selectedProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Use the full project list endpoint instead of user endpoint
        const response = await projectAPI.getAll();
        setProjects(response.data);
      } catch (error) {
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectClick = async (project) => {
    // Fetch full project details when selected
    try {
      const response = await projectAPI.getById(project.id);
      onProjectSelect(response.data);
    } catch (error) {
      toast.error('Failed to load project details');
      onProjectSelect(project);
    }
  };

  if (loading) {
    return <Spinner size="md" className="py-8" />;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icons.Folder />
        </div>
        <p className="text-gray-600 text-sm">No projects available</p>
        <p className="text-gray-500 text-xs mt-1">Create a project in Admin Dashboard first</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => handleProjectClick(project)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            selectedProject?.id === project.id
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              selectedProject?.id === project.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <Icons.Folder />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
              <p className="text-sm text-gray-600 truncate">{project.company_name}</p>
              
              {/* Show counts if available */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Icons.Document />
                  {project.documents_count || 0} docs
                </span>
                <span className="flex items-center gap-1">
                  <Icons.Database />
                  {project.datasources_count || 0} sources
                </span>
              </div>
              
              {project.industry && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                  {project.industry}
                </span>
              )}
            </div>

            {selectedProject?.id === project.id && (
              <div className="shrink-0 text-primary-600">
                <Icons.CheckCircle />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProjectSelector;
