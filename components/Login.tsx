
import React, { useState } from 'react';
import { User, UserWithPassword } from '../types';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface LoginProps {
 onLogin: (user: User) => void;
 users: UserWithPassword[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  // Simulate network delay
  setTimeout(() => {
   const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
   
   if (user) {
    // Remove password from object before saving state (security best practice for frontend state)
    const { password, ...userWithoutPassword } = user;
    onLogin(userWithoutPassword);
   } else {
    setError('Credenciais inválidas. Verifique seu email e senha.');
    setLoading(false);
   }
  }, 800);
 };

 return (
  <div className="min-h-screen flex items-center justify-center bg-white p-4">
   <div className="bg-white p-8 md:p-10 rounded-none shadow-xl w-full max-w-md border border-primary-100">
    <div className="text-center mb-8">
     <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4">
      <Lock size={28} />
     </div>
     <h1 className="text-3xl font-bold font-heading text-primary-900 tracking-tight mb-2">Casapē</h1>
     <p className="text-gray-500 text-sm uppercase tracking-wider">Central de Chamados</p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
     <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">Email Corporativo</label>
      <div className="relative group">
       <Mail className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
       <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
        placeholder="nome@casaperio.com.br"
        required
       />
      </div>
     </div>

     <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">Senha</label>
      <div className="relative group">
       <Lock className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
       <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
        placeholder="••••••••"
        required
       />
      </div>
     </div>

     {error && (
      <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center border border-red-100">
       {error}
      </div>
     )}

     <button
      type="submit"
      disabled={loading}
      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-none shadow-lg shadow-primary-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
     >
      {loading ? (
       <Loader2 className="animate-spin" size={20} />
      ) : (
       <>
        Entrar no Sistema <ArrowRight size={18} />
       </>
      )}
     </button>
    </form>

    <div className="mt-8 text-center">
     <p className="text-xs text-gray-400">
      Acesso restrito para equipe Casapē Boutique de Imóveis.
     </p>
    </div>
   </div>
  </div>
 );
};

export default Login;
