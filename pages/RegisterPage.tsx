
import React, { useState } from 'react';
import { Globe, Mail, Lock, ArrowRight, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps {
    onNavigate?: (path: string) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
    const { register, login } = useAuth(); // On utilisera login('outlook') pour l'OAuth
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authMode, setAuthMode] = useState<'email' | 'outlook' | null>(null);

    const handleEmailRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit faire au moins 6 caractères");
            return;
        }

        setAuthMode('email');
        setIsSubmitting(true);

        try {
            await register(email, password, name);
            // Redirection gérée par le AuthContext ou navigation manuelle si besoin
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue lors de l'inscription");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOutlookLogin = async () => {
        setAuthMode('outlook');
        setIsSubmitting(true);
        try {
            await login('outlook');
        } catch (err: any) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FDF8F6] dark:bg-slate-950">

            {/* Colonne Gauche - Visuel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-slate-900/90 mix-blend-multiply"></div>

                <div className="relative z-10 p-16 flex flex-col justify-between h-full text-white">
                    <div>
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Rejoignez FO Métaux</h1>
                        <p className="text-lg text-white/80 max-w-md">
                            Créez votre compte pour accéder aux outils, documents et ressources de la fédération.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold">Accès Instantané</h3>
                                <p className="text-sm text-white/60">Vos rôles sont configurés automatiquement</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne Droite - Formulaire */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">

                    <div className="text-center lg:text-left">
                        <div className="inline-flex lg:hidden bg-fo-red p-3 rounded-2xl shadow-lg shadow-red-500/30 mb-6">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Créer un compte</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Rejoignez l'espace numérique FO Métaux.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Bouton Outlook */}
                        <button
                            onClick={handleOutlookLogin}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] text-white p-3.5 rounded-xl hover:bg-[#1a1a1a] transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed group border border-transparent hover:border-slate-700"
                        >
                            {isSubmitting && authMode === 'outlook' ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <div className="grid grid-cols-2 gap-0.5">
                                    <div className="w-2.5 h-2.5 bg-[#f25022]"></div>
                                    <div className="w-2.5 h-2.5 bg-[#7fba00]"></div>
                                    <div className="w-2.5 h-2.5 bg-[#00a4ef]"></div>
                                    <div className="w-2.5 h-2.5 bg-[#ffb900]"></div>
                                </div>
                            )}
                            <span className="font-medium">S'inscrire avec Outlook</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#FDF8F6] dark:bg-slate-950 text-slate-500">Ou par email</span>
                            </div>
                        </div>

                        {/* Formulaire Email */}
                        <form onSubmit={handleEmailRegister} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Nom complet</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Jean Dupont"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email professionnel</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="nom@fo-metaux.fr"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Mot de passe</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Confirmer</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {isSubmitting && authMode === 'email' ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Créer mon compte</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Vous avez déjà un compte ?{' '}
                        <button
                            onClick={() => onNavigate?.('/login')}
                            className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                            Se connecter
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
