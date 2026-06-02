import React, { useState } from 'react';
import { Icons } from '../icons/Icons';
import Button from '../common/Button';
import Card from '../common/Card';
import { Textarea } from '../common/Input';
import { usePolicies } from '../../hooks/usePolicies';
import { POLICY_SECTIONS } from '../../utils/constants';
import toast from 'react-hot-toast';

const PolicyGenerator = ({ project, onPolicyGenerated }) => {
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const { generatePolicy } = usePolicies();
  const [generating, setGenerating] = useState(false);

  const defaultQuery = `Generate a comprehensive organizational policy document for ${project.company_name} covering all aspects of company operations, employee conduct, data security, compliance requirements, and operational procedures.`;

  const handleGenerate = async () => {
    if (!query.trim()) {
      toast.error('Please enter generation instructions');
      return;
    }

    // Check if project has data
    const hasData = (project.documents_count > 0) || (project.datasources_count > 0);
    if (!hasData) {
      toast.error('This project has no data. Please upload documents or add data sources first.');
      return;
    }

    setGenerating(true);
    try {
      const policy = await generatePolicy({
        project_id: project.id,
        query: query,
        title: title || undefined,
      });

      onPolicyGenerated(policy);
    } catch (error) {
      console.error('Failed to generate policy:', error);
      toast.error('Failed to start policy generation');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseDefault = () => {
    setQuery(defaultQuery);
  };

  const hasData = (project.documents_count > 0) || (project.datasources_count > 0);

  return (
    <Card
      title="Generate Policy Document"
      subtitle="Configure your policy generation request"
    >
      <div className="space-y-6">
        {/* Project Info */}
        <div className={`border rounded-lg p-4 ${
          hasData ? 'bg-primary-50 border-primary-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              hasData ? 'bg-primary-600 text-white' : 'bg-yellow-600 text-white'
            }`}>
              <Icons.Folder />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{project.name}</h4>
              <p className="text-sm text-gray-600">{project.company_name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Icons.Document />
                  {project.documents_count || 0} documents
                </span>
                <span className="flex items-center gap-1 text-gray-600">
                  <Icons.Database />
                  {project.datasources_count || 0} sources
                </span>
              </div>
              
              {!hasData && (
                <div className="mt-3 flex items-start gap-2 text-yellow-800">
                  <Icons.Warning />
                  <p className="text-sm">
                    <strong>No data available.</strong> Please upload documents or add data sources before generating policies.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="label">Policy Title (Optional)</label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${project.company_name} - Organizational Policy Document`}
          />
        </div>

        {/* Query Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Generation Instructions</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUseDefault}
            >
              Use Default
            </Button>
          </div>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={6}
            placeholder="Describe what you want in the policy document..."
          />
          <p className="text-xs text-gray-500 mt-2">
            The AI will generate a 25-30 page policy document based on your instructions and the project's data.
          </p>
        </div>

        {/* Policy Sections Preview */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Sections to be Generated:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {POLICY_SECTIONS.map((section, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="text-green-600 shrink-0">
                  <Icons.CheckCircle />
                </div>
                <span>{section}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4">
          <Button
            onClick={handleGenerate}
            loading={generating}
            disabled={!query.trim() || generating || !hasData}
            icon={<Icons.Sparkles />}
            className="w-full"
            size="lg"
          >
            {generating ? 'Generating Policy...' : 'Generate Policy Document'}
          </Button>
        </div>

        {generating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icons.Info />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Policy generation in progress
                </p>
                <p className="text-sm text-blue-800">
                  This may take 5-15 minutes depending on the amount of data and complexity.
                  You can monitor the progress below.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PolicyGenerator;
