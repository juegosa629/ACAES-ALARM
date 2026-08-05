import React from 'react';

function Tarjeta({ children, onClick, badge, className, image }) {
  return (
    <div className={`tarjeta ${className || ''}`} onClick={onClick}>
      {image && <img src={image} alt="Portada" className="imagen-portada" />}
      {children}
      {badge && <span className="badge">{badge}</span>}
    </div>
  );
}

export default Tarjeta;