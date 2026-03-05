const FleetStatus = ({ data }) => (
  <div className="card">
    <h3>Fleet & Material Status</h3>
    <p>Transport Required: {data.transportRequired ? 'Yes' : 'No'}</p>
    <p>Fleet Issues Today: {data.delayed}</p>
  </div>
);

export default FleetStatus;