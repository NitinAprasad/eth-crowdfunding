import React from 'react';
import authWrapper from '../helper/authWrapper';
import FundRiserForm from '../components/FundRiserForm';
import { useSelector } from 'react-redux';
import FundRiserCard from '../components/FundRiserCard';
import Loader from '../components/Loader';

const Dashboard = () => {
  const projectsList = useSelector((state) => state.projectReducer.projects);

  return (
    <div style={{
      maxWidth: 1280,
      margin: '0 auto',
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'row',
      gap: '2rem',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Projects list */}
      <div style={{ flex: '1 1 400px' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{
            fontSize: '1.35rem', fontWeight: 800,
            background: 'linear-gradient(90deg, #e2e8f0, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}>
            Active Projects
          </h1>
          <p style={{ color: 'rgba(200,215,255,0.45)', fontSize: '0.8rem', marginTop: 2 }}>
            {projectsList ? `${projectsList.length} project${projectsList.length !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>

        {projectsList !== undefined ? (
          projectsList.length > 0 ? (
            projectsList.map((data, i) => (
              <FundRiserCard props={data} key={i} />
            ))
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 20,
              padding: '3rem 2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
              <h3 style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 8 }}>
                No projects yet
              </h3>
              <p style={{ color: 'rgba(200,215,255,0.45)', fontSize: '0.85rem' }}>
                Launch the first one using the form →
              </p>
            </div>
          )
        ) : (
          <Loader />
        )}
      </div>

      {/* Create project form */}
      <div style={{ flex: '0 0 360px', position: 'sticky', top: '5rem' }}>
        <FundRiserForm />
      </div>
    </div>
  );
};

export default authWrapper(Dashboard);
