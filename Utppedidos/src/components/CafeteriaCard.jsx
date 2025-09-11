// src/components/CafeteriaCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function CafeteriaCard({ id, nombre, edificio, imagen }) {
  const navigate = useNavigate();

  return (
    <div className="cafeteria-card" onClick={() => navigate(`/menu/${id}`)}>
      <img src={imagen || '/images/cafeteria-default.png'} alt={nombre} />
      <h3>{nombre}</h3>
      <p>{edificio}</p>
    </div>
  );
}

export default CafeteriaCard;