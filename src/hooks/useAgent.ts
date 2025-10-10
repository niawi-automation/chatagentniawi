import { useContext } from 'react';
import { AgentContext } from '../contexts/AgentContext';

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}; 