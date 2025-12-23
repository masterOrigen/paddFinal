import React from 'react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <img src="/loading.gif" alt="Cargando..." />
      </div>
    </div>
  );
};

export default Loading;