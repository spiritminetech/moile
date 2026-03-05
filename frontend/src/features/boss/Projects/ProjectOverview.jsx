import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getProjectOverview,
  getProgressTimeline,
  getAttendanceSnapshot,
  //getAIRiskAnalysis,
  // getFleetStatus, // Fleet task API commented out
} from '../../../api/boss/bossProjectApi';

import ProjectHeader from '../../../components/boss/ProjectOverview/ProjectHeader';
import PlannedVsActual from '../../../components/boss/ProjectOverview/PlannedVsActual';
import AIRiskPanel from '../../../components/boss/ProjectOverview/AIRiskPanel';
import ProgressTimeline from '../../../components/boss/ProjectOverview/ProgressTimeline';
import ManpowerSnapshot from '../../../components/boss/ProjectOverview/ManpowerSnapshot';
// import FleetStatus from '../../components/FleetStatus'; // Fleet task component commented out

const ProjectOverview = () => {
  const { projectId } = useParams();
  const today = new Date().toISOString().split('T')[0];

  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [attendance, setAttendance] = useState(null);
//   const [aiRisk, setAiRisk] = useState(null);
  // const [fleet, setFleet] = useState(null); // Fleet state commented out

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [ov, tl, at /*, fl*/] = await Promise.all([
        getProjectOverview(projectId),
        getProgressTimeline(projectId),
        getAttendanceSnapshot(projectId, today),
        // getFleetStatus(projectId, today), // Fleet API call commented out
      ]);

      setOverview(ov.data);
      setTimeline(tl.data.timeline);
      setAttendance(at.data);
      // setFleet(fl.data); // Fleet data set commented out

      const aiPayload = {
        projectCode: ov.data.project.projectCode,
        plannedProgress: ov.data.plannedVsActual.plannedProgress,
        actualProgress: ov.data.plannedVsActual.actualProgress,
        manpower: at.data,
        // fleetIssues: fl.data.delayed, // Fleet issues commented out
        permitStatus: 'PENDING',
        daysDelayed: 10,
      };

     // const aiRes = await getAIRiskAnalysis(aiPayload);
     // setAiRisk(aiRes.data);
    } catch (err) {
      console.error('ProjectOverview load error:', err);
    }
  };

  if (!overview) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Project Header with heading inside card */}
      <ProjectHeader project={overview.project} />

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlannedVsActual data={overview.plannedVsActual} />
        {/* <AIRiskPanel risk={aiRisk} /> */}
      </div>

      {/* Progress Timeline */}
      <ProgressTimeline timeline={timeline} />

      {/* Manpower Snapshot */}
      <ManpowerSnapshot data={attendance} />

      {/* Fleet component commented out */}
      {/* <FleetStatus data={fleet} /> */}
    </div>
  );
};

export default ProjectOverview;
