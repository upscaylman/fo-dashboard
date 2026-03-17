// Composant invisible qui gère le tracking de présence
import { usePresence } from '../hooks/usePresence';
import { useUser } from './UserContext';

export const PresenceTracker: React.FC = () => {
  const { currentUser } = useUser();
  // Le hook usePresence gère déjà le visibilitychange et le heartbeat
  usePresence({ userEmail: currentUser?.email });

  // Ce composant ne rend rien visuellement
  return null;
};
