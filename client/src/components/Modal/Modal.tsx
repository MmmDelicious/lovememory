import React from 'react';
import BaseModal from '../BaseModal/BaseModal';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      maxWidth="lg"
    >
      {children}
    </BaseModal>
  );
};

export default Modal;