import React, { useState, useEffect } from 'react';
import { Icons } from '../icons/Icons';
import Button from '../common/Button';
import Card from '../common/Card';
import { CircularProgress } from '../common/ProgressBar';
import { usePolicies } from '../../hooks/usePolicies';

const PolicyStatus = ({ policy }) => {
  const [currentPolicy, setCurrentPolicy] = useState(policy);
  const { checkPolicyStatus, downloadPolicy } = usePolicies();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!policy || policy.status === 'completed' || policy.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      const status = await checkPolicyStatus(policy.id);
      if (status) {
        setCurrentPolicy((prev) => ({ ...prev, ...status }));
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [policy, checkPolicyStatus]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPolicy(
        currentPolicy.id,
        `${currentPolicy.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
      );
    } finally {
      setDownloading(false);
    }
  };

  const statusConfig = {
    pending: {
      color: 'yellow',
      icon: <Icons.Clock />,
      message: 'Policy generation is queued',
    },
    generating: {
      color: 'blue',
      icon: <Icons.Sparkles />,
      message: 'Generating policy document...',
    },
    completed: {
      color: 'green',
      icon: <Icons.CheckCircle />,
      message: 'Policy generation completed!',
    },
    failed: {
      color: 'red',
      icon: <Icons.XCircle />,
      message: 'Policy generation failed',
    },
  };

  const config = statusConfig[currentPolicy.status] || statusConfig.pending;

  return (
    <Card
      title="Generation Status"
      subtitle={currentPolicy.title}
    >
      <div className="space-y-6">
        {/* Status Display */}
        <div className="flex items-center justify-center py-6">
          {currentPolicy.status === 'generating' ? (
            <CircularProgress progress={currentPolicy.progress} size={120} />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-${config.color}-100 text-${config.color}-600`}>
              {config.icon}
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-1">
            {config.message}
          </p>
          {currentPolicy.status === 'generating' && (
            <p className="text-sm text-gray-600">
              Please wait while we generate your policy document...
            </p>
          )}
          {currentPolicy.status === 'failed' && currentPolicy.error_message && (
            <p className="text-sm text-red-600 mt-2">
              Error: {currentPolicy.error_message}
            </p>
          )}
        </div>

        {/* Metadata */}
        {currentPolicy.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Pages</p>
                <p className="font-semibold text-gray-900">{currentPolicy.page_count || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Sections</p>
                <p className="font-semibold text-gray-900">
                  {currentPolicy.generation_metadata?.sections_generated || 10}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Download Button */}
        {currentPolicy.status === 'completed' && currentPolicy.pdf_available && (
          <Button
            onClick={handleDownload}
            loading={downloading}
            icon={<Icons.Download />}
            className="w-full"
            size="lg"
          >
            Download PDF
          </Button>
        )}

        {/* Progress Steps */}
        {currentPolicy.status === 'generating' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-gray-900">{currentPolicy.progress}%</span>
            </div>
            <div className="space-y-1">
              {[
                { label: 'Initializing', threshold: 10 },
                { label: 'Retrieving data', threshold: 20 },
                { label: 'Generating sections', threshold: 90 },
                { label: 'Creating PDF', threshold: 100 },
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  {currentPolicy.progress >= step.threshold ? (
                    <Icons.CheckCircle />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={`text-sm ${
                    currentPolicy.progress >= step.threshold
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PolicyStatus;
