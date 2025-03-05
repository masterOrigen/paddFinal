import React from 'react';
import './Dashboard.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const pieData = {
    labels: ['PREMIUM VIP', 'Sparta Deportes Spa2', 'COLCHONES ROSEN S.A.I.C', 'PruebaSebastianSupremo'],
    datasets: [
      {
        data: [57.14, 14.29, 14.29, 14.29],
        backgroundColor: [
          '#4F46E5',
          '#EF4D36',
          '#FDB022',
          '#34D399',
        ],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° Agencias</h3>
              <p className="stat-number">2</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° de Clientes</h3>
              <p className="stat-number">8</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-user-group"></i>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° campañas</h3>
              <p className="stat-number">6</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <h3>N° de medios</h3>
              <p className="stat-number">11</p>
            </div>
            <div className="stat-icon">
              <i className="fas fa-image"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Productos</h2>
          <div className="chart-container">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Listado de Clientes</h2>
          <div className="clients-list">
            {[
              {
                name: 'Sparta Deportes Spa2',
                address: 'Dirección Empresa: Sarnida 456',
                phone: 'Teléfono Fijo: +56234343434'
              },
              {
                name: 'COLCHONES ROSEN S.A.I.C',
                address: 'Dirección Empresa: Avda Américo Vespucio Norte #1573',
                phone: 'Teléfono Fijo: 0226205300'
              },
              {
                name: 'Matias',
                address: 'Dirección Empresa: s',
                phone: 'Teléfono Fijo: 979428207'
              },
              {
                name: 'PruebaSebastianSupremo',
                address: 'Dirección Empresa: AV MARCONI 708',
                phone: 'Teléfono Fijo: 432231911'
              }
            ].map((client, index) => (
              <div key={index} className="client-item">
                <i className="fas fa-user"></i>
                <div className="client-info">
                  <h4>{client.name}</h4>
                  <p>{client.address}</p>
                  <p>{client.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Mensajes</h2>
          <div className="messages-list">
            {[
              {
                title: 'Soporte Mensaje 1',
                date: 'Fecha de creación: 12 agosto 2024 a las 20:09'
              },
              {
                title: 'Soporte Mensaje 2',
                date: 'Fecha de creación: 12 agosto 2024 a las 20:09'
              },
              {
                title: 'Soporte Mensaje 4',
                date: 'Fecha de creación: 12 agosto 2024 a las 20:10'
              },
              {
                title: 'Soporte Mensaje 3',
                date: 'Fecha de creación: 12 agosto 2024 a las 20:10'
              }
            ].map((message, index) => (
              <div key={index} className="message-item">
                <i className="fas fa-envelope"></i>
                <div className="message-info">
                  <h4>{message.title}</h4>
                  <p>{message.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;