import React from 'react';
import { AppContext } from '../../../app/AppContext';

export type Props = {
  open: boolean;
  onClose(): void;
  onRepositorySelected?(repositoryName: string): void;
  currentRepository?: string;
};

export default function RepositoryManager({ open, onClose, onRepositorySelected, currentRepository }: Props) {
  if( !open ) return;

  const app = React.useContext(AppContext);

  const provider = app.repository !;
  const Manager = provider.manager();
  const Content = () => Manager ? <Manager open={open} 
          onClose={onClose}
          onRepositorySelected={onRepositorySelected}
          currentRepository={currentRepository}
   /> : <h1>Nada que configurar.</h1>;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Gestor de repositorios y compartidos">
      <div className="modal" style={{ minWidth: 560, maxWidth: 720 }}>
        <Content />
      </div>
    </div>
  );
}
