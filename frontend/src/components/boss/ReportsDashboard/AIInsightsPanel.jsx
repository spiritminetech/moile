export default function AIInsightsPanel({ insights }) {
  return (
    <div className="card ai-panel">
      <h3>AI Insights 🤖</h3>
      <ul>
        {insights.map((text, idx) => (
          <li key={idx}>{text}</li>
        ))}
      </ul>
    </div>
  );
}