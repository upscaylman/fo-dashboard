import React, { useState } from 'react';
import { Mail, AlertCircle, ArrowRight, CheckCircle, PenTool, Shield, Zap } from 'lucide-react';
import { checkEmailAccess } from '../services/firebaseApi';

interface LoginPageProps {
  onSubmit: (email: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse e-mail valide.');
      return;
    }

    setIsLoading(true);
    try {
      const hasAccess = await checkEmailAccess(email.trim());
      if (hasAccess) {
        onSubmit(email.trim());
      } else {
        setError('Vous n\'êtes pas autorisé à accéder à cette plateforme. Vous devez être destinataire d\'un document ou figurez sur la liste d\'accès.');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setError('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-surface">
      
      {/* Colonne Gauche - Visuel (Caché sur mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background avec image et overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-onPrimaryContainer/90"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white/10 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white/10 rounded-2xl rotate-45 animate-float-medium"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-xl animate-float-fast"></div>
          
          {/* Light rays */}
          <div className="absolute top-0 left-1/3 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-white/5 to-transparent transform skew-x-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 p-12 xl:p-16 flex flex-col justify-between h-full text-white">
          {/* Logo et Titre */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white/15 backdrop-blur-xl p-3 rounded-xl flex items-center justify-center shadow-lg shadow-black/20 border border-white/20 transition-transform hover:scale-110">
                <PenTool className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">SignEase</h1>
                <p className="text-sm text-white/70">by FO Metaux</p>
              </div>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Signez vos documents<br />
              <span className="text-white/80">en toute simplicité</span>
            </h2>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              La solution de signature électronique moderne et sécurisée, 
              pensée pour les organisations syndicales.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 group">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-5 h-5 text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Sécurisé & Conforme</h3>
                <p className="text-sm text-white/60">Conformité légale garantie</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 group">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Ultra Rapide</h3>
                <p className="text-sm text-white/60">Signature en quelques clics</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 group">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <PenTool className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Simple d'utilisation</h3>
                <p className="text-sm text-white/60">Interface intuitive et moderne</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne Droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Background pattern subtil */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primaryContainer/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiaryContainer/20 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex lg:hidden bg-gradient-primary p-3 rounded-xl shadow-lg shadow-primary/30 mb-6 elevation-2">
              <PenTool className="h-8 w-8 text-onPrimary" />
            </div>
            <h2 className="text-3xl font-bold text-onSurface">Bienvenue</h2>
            <p className="text-onSurfaceVariant mt-2">
              Connectez-vous pour accéder à vos documents.
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-errorContainer/30 border border-error/30 rounded-2xl animate-shake backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <h3 className="font-semibold text-error text-sm">Erreur d'authentification</h3>
                <p className="text-error/80 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-error hover:text-error/70 text-xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-onSurface ml-1">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-outline" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-outlineVariant rounded-2xl leading-5 bg-surface text-onSurface placeholder-outline focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary hover:border-primary/50 shadow-sm hover:shadow-md"
                  placeholder="exemple@votreentreprise.fr"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-onSurfaceVariant ml-1 mt-2">
                Vous devez être destinataire d'un document ou figurer sur la liste d'accès.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 btn-premium-shine btn-premium-extended focus:outline-none focus:ring-4 focus:ring-primary/30 inline-flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Vérification en cours...</span>
                </>
              ) : (
                <>
                  <span>Continuer</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outlineVariant"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-onSurfaceVariant">Comment ça marche ?</span>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-primaryContainer/20 rounded-2xl border border-primaryContainer/30 hover:bg-primaryContainer/30 transition-all duration-300 group">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                <span className="text-primary font-bold">1</span>
              </div>
              <p className="text-xs text-onSurface font-medium">Entrez votre email</p>
            </div>
            <div className="text-center p-4 bg-secondaryContainer/20 rounded-2xl border border-secondaryContainer/30 hover:bg-secondaryContainer/30 transition-all duration-300 group">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                <span className="text-secondary font-bold">2</span>
              </div>
              <p className="text-xs text-onSurface font-medium">Accédez au document</p>
            </div>
            <div className="text-center p-4 bg-tertiaryContainer/20 rounded-2xl border border-tertiaryContainer/30 hover:bg-tertiaryContainer/30 transition-all duration-300 group">
              <div className="w-10 h-10 bg-tertiary/10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                <span className="text-tertiary font-bold">3</span>
              </div>
              <p className="text-xs text-onSurface font-medium">Signez en 1 clic</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4 pt-4">
            <p className="text-xs text-onSurfaceVariant">
              © 2026 SignEase by FO Metaux. Tous droits réservés.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-onSurfaceVariant/70">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Signature électronique légalement valide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
