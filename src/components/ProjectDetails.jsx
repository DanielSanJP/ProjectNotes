import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getProject,
  updateProject,
  deleteProject,
} from "../services/projectService";
import { getNotes, createNote, deleteNote } from "../services/projectService";
import toast from "react-hot-toast";
import "../styles/ProjectDetails.css";

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSummary, setNoteSummary] = useState("");
  const loadProjectAndNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectData = await getProject(projectId);
      setProject(projectData);
      setProjectTitle(projectData.title);
      setProjectDescription(projectData.description || "");

      const notesData = await getNotes(projectId);
      setNotes(notesData);
    } catch (error) {
      toast.error("Failed to load project");
      console.error(error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    loadProjectAndNotes();
  }, [loadProjectAndNotes]);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await updateProject(projectId, {
        title: projectTitle,
        description: projectDescription,
      });
      setProject(updatedProject);
      setIsEditModalOpen(false);
      toast.success("Project updated successfully!");
    } catch (error) {
      toast.error("Failed to update project");
      console.error(error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      toast.success("Project deleted successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const newNote = await createNote({
        project_id: projectId,
        title: noteTitle,
        summary: noteSummary,
        order_index: notes.length,
      });
      setNotes([...notes, newNote]);
      setIsNoteModalOpen(false);
      setNoteTitle("");
      setNoteSummary("");
      toast.success("Note created successfully!");
    } catch (error) {
      toast.error("Failed to create note");
      console.error(error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
      toast.success("Note deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div>Loading project...</div>;
  }

  return (
    <div className="project-details-container">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-title-row">
              <Link to="/" className="back-link">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="back-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Dashboard
              </Link>
            </div>
            <h1 className="project-title">{project.title}</h1>
            {project.description && (
              <p className="project-description">{project.description}</p>
            )}
          </div>
          <div className="header-buttons">
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="btn btn-primary"
            >
              New Note
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-secondary"
            >
              Edit
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div>
          <h2 className="section-title">Notes</h2>

          {notes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-message">
                No notes yet. Create your first note to get started.
              </p>
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="btn btn-primary"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="notes-grid">
              <div
                className="new-note-card"
                onClick={() => setIsNoteModalOpen(true)}
              >
                <div className="new-note-icon">+</div>
                <div className="new-note-text">New Note</div>
              </div>
              {notes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-card-content">
                    <h3 className="note-title">{note.title}</h3>
                    {note.summary && (
                      <p className="note-summary">{note.summary}</p>
                    )}
                    <div className="note-updated-date">
                      Updated: {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="note-card-footer">
                    <Link to={`/notes/${note.id}`} className="btn btn-primary">
                      View Note
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteNote(note.id);
                      }}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Edit Project</h3>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label htmlFor="edit-title" className="form-label">
                  Title
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description" className="form-label">
                  Description (optional)
                </label>
                <textarea
                  id="edit-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="form-textarea"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Delete Project</h3>
            <p className="form-group">
              Are you sure you want to delete this project? This action cannot
              be undone and all notes and page sections will be permanently
              deleted.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                className="btn btn-danger"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {isNoteModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Create New Note</h3>
            <form onSubmit={handleCreateNote}>
              <div className="form-group">
                <label htmlFor="note-title" className="form-label">
                  Title
                </label>
                <input
                  type="text"
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                  placeholder="e.g., Homepage Design"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="note-summary" className="form-label">
                  Summary (optional)
                </label>
                <textarea
                  id="note-summary"
                  value={noteSummary}
                  onChange={(e) => setNoteSummary(e.target.value)}
                  rows={3}
                  placeholder="Brief description of this note"
                  className="form-textarea"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetails;
