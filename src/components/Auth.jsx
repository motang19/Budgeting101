import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account!');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Budget Calendar</h1>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {isLogin ? 'Sign in to your account' : 'Create an account'}
        </h2>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-4 bg-green-50 p-3 rounded-lg">{message}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-blue-500 hover:underline font-medium">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;