import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/icons/Icons';
import Button from '../components/common/Button';

const Home = () => {
  const features = [
    {
      icon: <Icons.Upload />,
      title: 'Multi-Format Upload',
      description: 'Upload PDF, DOCX, CSV, Excel, JSON files',
    },
    {
      icon: <Icons.Database />,
      title: 'Database Integration',
      description: 'Connect to PostgreSQL and other databases',
    },
    {
      icon: <Icons.Globe />,
      title: 'URL Scraping',
      description: 'Extract content from web pages',
    },
    {
      icon: <Icons.Sparkles />,
      title: 'AI-Powered Generation',
      description: 'Generate 25-30 page policy documents',
    },
    {
      icon: <Icons.Document />,
      title: 'Professional PDFs',
      description: 'Download formatted policy documents',
    },
    {
      icon: <Icons.CheckCircle />,
      title: '100% Free',
      description: 'No API costs - runs locally with Ollama',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
          <Icons.Sparkles />
          <span>Free & Open Source AI System</span>
        </div>
        
        <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          Generate Professional<br />
          <span className=" from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Policy Documents
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Upload your data, connect databases, scrape URLs, and generate comprehensive
          organizational policy documents with AI - completely free and open source.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link to="/admin">
            <Button size="lg" icon={<Icons.Database />}>
              Admin Dashboard
            </Button>
          </Link>
          <Link to="/user">
            <Button size="lg" variant="outline" icon={<Icons.Sparkles />}>
              Generate Policy
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to create comprehensive policy documents
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 bg-white rounded-2xl border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built with Open Source
          </h2>
          <p className="text-gray-600">
            Powered by free and open-source technologies
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8">
          {[
            { name: 'FastAPI', desc: 'Backend Framework' },
            { name: 'PostgreSQL', desc: 'Database' },
            { name: 'Ollama', desc: 'Local LLM' },
            { name: 'Qdrant', desc: 'Vector DB' },
            { name: 'React', desc: 'Frontend' },
            { name: 'Tailwind', desc: 'Styling' },
            { name: 'Python', desc: 'Backend Language' },
            { name: 'Vite', desc: 'Build Tool' },
          ].map((tech, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16  from-primary-500 to-purple-600 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                {tech.name.charAt(0)}
              </div>
              <h4 className="font-semibold text-gray-900">{tech.name}</h4>
              <p className="text-sm text-gray-500">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 space-y-6">
        <h2 className="text-4xl font-bold text-gray-900">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create your first project and generate professional policy documents in minutes
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/admin">
            <Button size="lg" icon={<Icons.Plus />}>
              Create Project
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
