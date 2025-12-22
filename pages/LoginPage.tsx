import React, { useState } from 'react';
import { Globe, Mail, Lock, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
    onNavigate?: (path: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authMode, setAuthMode] = useState<'email' | 'outlook' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(() => {
        // Charger la préférence sauvegardée
        return localStorage.getItem('fo-metaux-remember-me') === 'true';
    });

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setAuthMode('email');
        setIsSubmitting(true);
        setError(null);

        try {
            // Sauvegarder la préférence "Se souvenir de moi"
            localStorage.setItem('fo-metaux-remember-me', rememberMe.toString());
            
            await login('email', { email, password });
        } catch (err: any) {
            console.error('Erreur de connexion:', err);
            setError(err.message || 'Erreur de connexion. Vérifiez vos identifiants.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOutlookLogin = async () => {
        setAuthMode('outlook');
        setIsSubmitting(true);
        setError(null);

        try {
            await login('outlook');
        } catch (err: any) {
            console.error('Erreur OAuth:', err);
            setError(err.message || 'Erreur de connexion avec Outlook.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) return;

        setResetLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setResetEmailSent(true);
        } catch (err: any) {
            console.error('Erreur réinitialisation:', err);
            setError(err.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation.');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FDF8F6] dark:bg-slate-950">

            {/* Colonne Gauche - Visuel (Caché sur mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-fo-red/90 to-slate-900/90 mix-blend-multiply"></div>

                <div className="relative z-10 p-16 flex flex-col justify-between h-full text-white">
                    <div>
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Fédération FO de la Métallurgie</h1>
                        <p className="text-lg text-white/80 max-w-md">
                            Gérez vos documents, suivez l'activité syndicale et accédez aux ressources fédérales en un seul endroit.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-bold">Sécurisé & Privé</h3>
                                <p className="text-sm text-white/60">Authentification forte requise</p>
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
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Bienvenue</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Connectez-vous à votre espace personnel.</p>
                    </div>

                    {/* Message d'erreur */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">Erreur de connexion</h3>
                                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xl font-bold"
                            >
                                ×
                            </button>
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
                            <span className="font-medium">Connexion avec Outlook</span>
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#FDF8F6] dark:bg-slate-950 text-slate-500">Ou avec votre email</span>
                            </div>
                        </div>

                        {/* Formulaire Email */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
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
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                                    />
                                    <span className="text-slate-600 dark:text-slate-400">Se souvenir de moi</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(true);
                                        setResetEmail(email);
                                        setError(null);
                                    }}
                                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 bg-transparent border-none cursor-pointer"
                                >
                                    Mot de passe oublié ?
                                </button>
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
                                        <span>Se connecter</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
                                Pas encore de compte ?{' '}
                                <button
                                    onClick={() => onNavigate?.('/register')}
                                    className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                >
                                    Créer un compte
                                </button>
                            </p>
                        </form>
                    </div>

                    {/* Bouton de dépannage (cache clear) */}
                    <div className="text-center">
                        <button
                            onClick={() => {
                                if (confirm('Voulez-vous réinitialiser le cache ? Cela peut résoudre les problèmes de connexion.')) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                        >
                            Problème de connexion ? Nettoyer le cache
                        </button>
                    </div>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
                        © 2025 Fédération FO Métaux. Tous droits réservés.
                        <br />
                        En vous connectant, vous acceptez les CGU et la politique de confidentialité.
                    </p>
                </div>
            </div>

            {/* Modal Mot de passe oublié */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
                        {resetEmailSent ? (
                            // Confirmation d'envoi
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Email envoyé !</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Un lien de réinitialisation a été envoyé à <strong>{resetEmail}</strong>. Vérifiez votre boîte de réception (et vos spams).
                                </p>
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetEmailSent(false);
                                        setResetEmail('');
                                    }}
                                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        ) : (
                            // Formulaire de demande
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setError(null);
                                        }}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                                    </button>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Mot de passe oublié</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Entrez votre email pour recevoir un lien de réinitialisation</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                placeholder="votre@email.fr"
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotPassword(false);
                                                setError(null);
                                            }}
                                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            {resetLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                'Envoyer le lien'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;