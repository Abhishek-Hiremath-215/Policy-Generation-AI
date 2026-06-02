import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons } from '../icons/Icons';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { isMockActive, setMockActive } from '../../services/api';

const Navbar = () => {
  const location = useLocation();
  const [isMock, setIsMock] = useState(isMockActive());
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const handleStateChange = () => {
      setIsMock(isMockActive());
    };
    window.addEventListener('mock_api_state_changed', handleStateChange);
    return () => {
      window.removeEventListener('mock_api_state_changed', handleStateChange);
    };
  }, []);

  const handleToggleMock = () => {
    const nextState = !isMock;
    setMockActive(nextState);
    window.location.reload(); // Refresh the page to clear hooks states and re-initialize mock DB
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: <Icons.Folder /> },
    { path: '/admin', label: 'Admin Dashboard', icon: <Icons.Database /> },
    { path: '/user', label: 'Generate Policy', icon: <Icons.Sparkles /> },
  ];

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <Icons.Sparkles />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-none">Policy AI</h1>
                <p className="text-[10px] text-gray-500 mt-0.5">Automated RAG Compliance</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Dynamic Status / Demo Mode Indicator */}
            <div className="flex items-center gap-2">
              {isMock ? (
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold cursor-pointer shadow-sm transition-all hover:scale-105"
                >
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />
                  <span>Demo Mode Active</span>
                  <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded-full font-bold">INFO</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 hover:bg-green-100 text-green-700 rounded-full text-xs font-semibold cursor-pointer shadow-sm transition-all hover:scale-105"
                >
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span>Local Server Active</span>
                  <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-bold font-mono">LIVE</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="flex items-center justify-around py-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-primary-700 font-medium'
                      : 'text-gray-600'
                  }`}
                >
                  {link.icon}
                  <span className="text-xs">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Info / Toggle Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={isMock ? "🤖 Standalone Demo Mode Active" : "🔌 Connected to Local RAG API"}
        size="md"
      >
        <div className="space-y-5">
          {isMock ? (
            <>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-900 leading-relaxed">
                <p className="font-semibold mb-1">Perfect for Portfolio & Resume Review!</p>
                To showcase this project seamlessly without requiring a running Python FastAPI backend, Qdrant vector database, or local Ollama LLM, we built a **fully interactive browser-based Mock API service** utilizing localStorage persistence.
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">What you can test in this Demo:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="text-green-600">✔</span>
                    <span>Create & manage custom projects</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✔</span>
                    <span>Simulate uploading document files (PDF, DOCX)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✔</span>
                    <span>Simulate URL scraping & DB source syncs</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✔</span>
                    <span>Generate full-text policy documents</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✔</span>
                    <span>Watch real-time generation progress steps</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600">✔</span>
                    <span>Download detailed, compiled policy reports</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Are you running the full-stack system locally? Flip the switch below to attempt connecting to your local FastAPI server running at <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">http://localhost:8000</code>.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-semibold text-gray-700">Database Connection Target</p>
                    <p className="text-xs text-gray-500 font-mono">http://localhost:8000/api/v1</p>
                  </div>
                  <Button onClick={handleToggleMock} size="sm" variant="outline">
                    Switch to Local Server
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-950 leading-relaxed">
                <p className="font-semibold mb-1">Connected to local Python FastAPI Server!</p>
                The frontend is currently making live, actual REST queries to your local FastAPI server at <code className="bg-green-100 px-1 py-0.5 rounded font-mono text-xs text-green-900">localhost:8000</code>. All data processing, RAG vector database queries, and AI generation tasks are executing on your machine.
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  If you want to host this site on Netlify as a live portfolio item, or if your local server is offline right now, you can toggle **Demo Mode** on. This tells the application to run self-contained within your browser.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-semibold text-gray-700">Database Connection Target</p>
                    <p className="text-xs text-indigo-600 font-semibold">Self-Contained Browser LocalStorage</p>
                  </div>
                  <Button onClick={handleToggleMock} size="sm" variant="outline" className="border-indigo-600 text-indigo-700 hover:bg-indigo-50">
                    Switch to Standalone Demo
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <Button onClick={() => setShowInfoModal(false)} variant="primary">
              Got it, Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;
