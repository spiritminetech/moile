import React from 'react';

const formatDate = (dateString) => {
  if (!dateString) return '-';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

const ProjectHeader = ({ project }) => (
  <div className="card shadow-lg rounded-xl p-4 mb-4 bg-white">
    {/* Heading */}
    <h2 className="text-lg font-bold uppercase mb-2 border-b pb-2">
      Project Overview
    </h2>

    {/* Project Info */}
    <p className="mb-1">
      <span className="font-semibold">Project:</span>{' '}
      {project.projectCode} – {project.projectName}
    </p>

    <p className="mb-1">
      <span className="font-semibold">Client:</span> {project.clientName}
    </p>

    <p className="mb-1">
      <span className="font-semibold">Status:</span>{' '}
      <strong>{project.status}</strong> | Progress:{' '}
      {project.overallProgress}%
    </p>

    {/* Progress bar */}
    <div className="w-full bg-gray-200 rounded-full h-2 my-2">
      <div
        className={`h-2 rounded-full ${
          project.status === 'Delayed' ? 'bg-red-500' : 'bg-blue-500'
        }`}
        style={{ width: `${project.overallProgress}%` }}
      />
    </div>

    {/* Dates */}
    <p className="mb-1">
      <span className="font-semibold">Start:</span>{' '}
      {formatDate(project.startDate)}{' '}
      | <span className="font-semibold">Planned End:</span>{' '}
      {formatDate(project.plannedEndDate)}
    </p>

    <p>
      <span className="font-semibold">Expected End:</span>{' '}
      {formatDate(project.expectedEndDate)}
    </p>
  </div>
);

export default ProjectHeader;
