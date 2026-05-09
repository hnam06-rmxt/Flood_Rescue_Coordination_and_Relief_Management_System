import { useRescueRequestStore } from "../../hooks/useRescueRequestStore";
import { rescueRequestActions } from "../../store/rescueRequestStore";

export function RescueRequestWorkspace() {
  const draft = useRescueRequestStore((state) => state.draft);
  const apiAvailable = useRescueRequestStore((state) => state.apiAvailable);
  const reason = useRescueRequestStore((state) => state.reason);
  const plannedEndpoints = useRescueRequestStore((state) => state.plannedEndpoints);

  return (
    <section className="workspace-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Citizen rescue module</p>
          <h2>Scaffold ready for the next backend step</h2>
        </div>
        <span className={`status-badge ${apiAvailable ? "status-live" : "status-warn"}`}>
          {apiAvailable ? "API ready" : "Backend pending"}
        </span>
      </div>

      <p className="card-copy">{reason}</p>

      <div className="grid-two">
        <div className="panel form-panel">
          <div className="panel-heading">
            <h3>Draft store</h3>
            <button className="ghost-button" onClick={() => rescueRequestActions.resetDraft()} type="button">
              Reset draft
            </button>
          </div>

          <label className="field">
            <span>Description</span>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(event) => rescueRequestActions.updateDraft("description", event.target.value)}
              placeholder="People trapped on rooftop, need boat support."
            />
          </label>

          <label className="field">
            <span>Location</span>
            <input
              value={draft.location}
              onChange={(event) => rescueRequestActions.updateDraft("location", event.target.value)}
              placeholder="Ward / street / district"
            />
          </label>

          <div className="grid-two compact-grid">
            <label className="field">
              <span>Latitude</span>
              <input
                value={draft.latitude}
                onChange={(event) => rescueRequestActions.updateDraft("latitude", event.target.value)}
                placeholder="10.8231"
              />
            </label>

            <label className="field">
              <span>Longitude</span>
              <input
                value={draft.longitude}
                onChange={(event) => rescueRequestActions.updateDraft("longitude", event.target.value)}
                placeholder="106.6297"
              />
            </label>
          </div>

          <label className="field">
            <span>Image URL</span>
            <input
              value={draft.image}
              onChange={(event) => rescueRequestActions.updateDraft("image", event.target.value)}
              placeholder="https://example.com/flood-scene.jpg"
            />
          </label>

          <label className="field">
            <span>Urgency</span>
            <select
              value={draft.urgencyLevel}
              onChange={(event) =>
                rescueRequestActions.updateDraft("urgencyLevel", event.target.value as typeof draft.urgencyLevel)
              }
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Planned contract</h3>
            <button className="ghost-button" onClick={() => rescueRequestActions.hydrateModuleStatus()} type="button">
              Refresh module note
            </button>
          </div>

          <ul className="endpoint-list">
            {plannedEndpoints.map((endpoint) => (
              <li key={endpoint}>
                <code>{endpoint}</code>
              </li>
            ))}
          </ul>

          <pre className="code-block">{JSON.stringify(draft, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
}
