
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-[rgb(216,194,191)]">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Fédération FO de la Métallurgie</p>
          <div className="flex items-center space-x-4">
            <a href="mailto:contact@fo-metaux.fr" className="hover:text-blue-600 transition-colors">
              contact@fo-metaux.fr
            </a>
            <span className="text-slate-300">•</span>
            <a href="tel:+33153945400" className="hover:text-blue-600 transition-colors">
              01 53 94 54 00
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
