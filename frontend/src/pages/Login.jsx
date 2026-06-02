import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Icons } from '../components/icons/Icons';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const lowerEmail = email.trim().toLowerCase();
      const trimmedPass = password.trim();

      if (lowerEmail === 'admin@policyai.com' && trimmedPass === 'admin123') {
        localStorage.setItem('policy_ai_role', 'admin');
        localStorage.setItem('policy_ai_logged_in', 'true');
        toast.success('Logged in successfully as Administrator');
        navigate('/admin');
      } else if (lowerEmail === 'user@policyai.com' && trimmedPass === 'user123') {
        localStorage.setItem('policy_ai_role', 'user');
        localStorage.setItem('policy_ai_logged_in', 'true');
        toast.success('Logged in successfully as Compliance Operator');
        navigate('/user');
      } else {
        toast.error('Invalid credentials. Use the pre-filled logins below!');
      }
    }, 800);
  };

  const handleQuickLogin = (role) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('policy_ai_role', role);
      localStorage.setItem('policy_ai_logged_in', 'true');
      toast.success(`Logged in as ${role === 'admin' ? 'Administrator' : 'Compliance Operator'}`);
      navigate(role === 'admin' ? '/admin' : '/user');
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-100/90 border border-slate-200 rounded-2xl p-8 shadow-md">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md mb-4">
            <Icons.Sparkles />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Sign In to Policy AI
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Access your automated RAG compliance platform
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., admin@policyai.com"
            />
            
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center bg-gradient-to-r from-primary-600 to-purple-600 border-none hover:from-primary-700 hover:to-purple-700"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Pre-filled Credentials / Quick Login */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-4">
            Demo Version Gateways (Click to enter)
          </h3>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Admin Quick Login */}
            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-center shadow-xs hover:shadow-sm cursor-pointer transition-all duration-200"
            >
              <span className="text-xs font-bold text-primary-700">Administrator Role</span>
              <span className="text-[10px] text-slate-500 font-mono mt-1">admin@policyai.com</span>
              <span className="text-[10px] text-slate-400 font-mono">pass: admin123</span>
            </button>

            {/* User Quick Login */}
            <button
              onClick={() => handleQuickLogin('user')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-center shadow-xs hover:shadow-sm cursor-pointer transition-all duration-200"
            >
              <span className="text-xs font-bold text-purple-700">Operator Role</span>
              <span className="text-[10px] text-slate-500 font-mono mt-1">user@policyai.com</span>
              <span className="text-[10px] text-slate-400 font-mono">pass: user123</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
