import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { getProjects, createProject } from "../services/projectService";
import toast from "react-hot-toast";
import "../styles/Dashboard.css";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      toast.error("Failed to load projects");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const newProject = await createProject({
        title: projectTitle,
        description: projectDescription,
        user_id: user.id,
      });
      setProjects([newProject, ...projects]);
      setIsModalOpen(false);
      setProjectTitle("");
      setProjectDescription("");
      toast.success("Project created successfully!");
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="app-title">ProjectNotes</h1>
          <div className="header-buttons">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              New Project
            </button>
            <button onClick={handleSignOut} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <h2 className="section-title">My Projects</h2>

        {isLoading ? (
          <div className="loading-message">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            {" "}
            <p className="empty-state-message">
              You don&apos;t have any projects yet.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            <div
              className="new-project-card"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="new-project-icon">+</div>
              <div className="new-project-text">New Project</div>
            </div>
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-card-content">
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-description">
                    {project.description || "No description"}
                  </p>
                  <div className="project-created-date">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="project-card-footer">
                  <Link
                    to={`/projects/${project.id}`}
                    className="btn btn-primary"
                  >
                    View Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="form-textarea"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
