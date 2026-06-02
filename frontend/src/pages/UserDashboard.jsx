import React, { useState } from 'react';
import { Icons } from '../components/icons/Icons';
import Card from '../components/common/Card';
import ProjectSelector from '../components/user/ProjectSelector';
import PolicyGenerator from '../components/user/PolicyGenerator';
import PolicyStatus from '../components/user/PolicyStatus';

const UserDashboard = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [generatingPolicy, setGeneratingPolicy] = useState(null);

  const handlePolicyGenerated = (policy) => {
    setGeneratingPolicy(policy);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Icons.Sparkles />
          <h1 className="text-3xl font-bold text-gray-900">Generate Policy Document</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a project and generate comprehensive policy documents with AI
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Project Selection */}
        <div className="lg:col-span-1">
          <Card title="Select Project">
            <ProjectSelector
              onProjectSelect={setSelectedProject}
              selectedProject={selectedProject}
            />
          </Card>
        </div>

        {/* Right Column - Policy Generation */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProject ? (
            <>
              <PolicyGenerator
                project={selectedProject}
                onPolicyGenerated={handlePolicyGenerated}
              />
              
              {generatingPolicy && (
                <PolicyStatus policy={generatingPolicy} />
              )}
            </>
          ) : (
            <Card>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.Folder />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Project Selected
                </h3>
                <p className="text-gray-600">
                  Select a project from the left to start generating policies
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
