import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';

export type BookmarkType = 'template' | 'news' | 'link';

export interface BookmarkedItem {
  id: string | number;
  type: BookmarkType;
  title: string;
  url: string;
  subtitle?: string; // Pour stocker la catégorie ou le type de fichier
}

interface BookmarkContextType {
  bookmarks: BookmarkedItem[];
  addBookmark: (item: BookmarkedItem) => void;
  addMultipleBookmarks: (items: BookmarkedItem[]) => void;
  removeBookmark: (id: string | number) => void;
  toggleBookmark: (item: BookmarkedItem) => void;
  isBookmarked: (id: string | number) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkedItem[]>([]);
  const { addToast } = useToast();
  const STORAGE_KEY = 'fo_metaux_bookmarks';

  // Chargement initial
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur lecture favoris", e);
      }
    }
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = useCallback((item: BookmarkedItem) => {
    setBookmarks(prev => {
        if (prev.some(b => b.id === item.id)) return prev;
        return [item, ...prev];
    });
    addToast("Ajouté aux favoris", 'success');
  }, [addToast]);

  const addMultipleBookmarks = useCallback((items: BookmarkedItem[]) => {
    setBookmarks(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const newItems = items.filter(item => !existingIds.has(item.id));
      if (newItems.length === 0) {
        addToast("Ces éléments sont déjà dans vos favoris", 'info');
        return prev;
      }
      return [...newItems, ...prev];
    });
    addToast(`${items.length} élément(s) ajouté(s) aux favoris`, 'success');
  }, [addToast]);

  const removeBookmark = useCallback((id: string | number) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    addToast("Retiré des favoris", 'info');
  }, [addToast]);

  const isBookmarked = useCallback((id: string | number) => {
    return bookmarks.some(b => b.id === id);
  }, [bookmarks]);

  const toggleBookmark = useCallback((item: BookmarkedItem) => {
    if (isBookmarked(item.id)) {
      removeBookmark(item.id);
    } else {
      addBookmark(item);
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, addMultipleBookmarks, removeBookmark, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
};