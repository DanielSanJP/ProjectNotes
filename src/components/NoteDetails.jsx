import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getNote, updateNote, deleteNote } from "../services/projectService";
import PageNavigation from "./PageNavigation";
import SectionThumbnails from "./SectionThumbnails";
import {
  getPageSections,
  createPageSection,
  updatePageSection,
  deletePageSection,
  uploadImage,
  getImageUrlFromPath,
  getDirectImageUrl,
} from "../services/projectService";
import toast from "react-hot-toast";
import "../styles/NoteDetails.css";
import EditablePageSection from "./EditablePageSection";

function NoteDetails() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [pageSections, setPageSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSummary, setNoteSummary] = useState("");
  const [pageName, setPageName] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionImageUrls, setSectionImageUrls] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const mainContentRef = useRef(null);
  const loadNoteAndSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const noteData = await getNote(noteId);
      setNote(noteData);
      setNoteTitle(noteData.title);
      setNoteSummary(noteData.summary || "");

      const sectionsData = await getPageSections(noteId);
      setPageSections(sectionsData);

      // Load image URLs for all sections with image paths
      const imageUrls = {};
      for (const section of sectionsData) {
        if (section.image_path) {
          try {
            // First try the synchronous direct URL method (more reliable)
            const directUrl = getDirectImageUrl(section.image_path);

            if (directUrl) {
              imageUrls[section.id] = directUrl;
              continue; // Skip the async attempt if we already have a URL
            }

            // If direct URL didn't work, try the async method
            const url = await getImageUrlFromPath(section.image_path);
            if (url) {
              console.log(`Using async URL for section ${section.id}: ${url}`);
              imageUrls[section.id] = url;
            } else {
              // Last resort: use the original path directly
              console.log(
                `Falling back to original path for section ${section.id}`
              );
              imageUrls[section.id] = section.image_path;
            }
          } catch (err) {
            console.error(`Error getting URL for section ${section.id}:`, err);
            // Keep the original URL as fallback
            imageUrls[section.id] = section.image_path;
          }
        }
      }
      setSectionImageUrls(imageUrls);
    } catch (error) {
      toast.error("Failed to load note");
      console.error(error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  }, [noteId, navigate]);

  useEffect(() => {
    loadNoteAndSections();
  }, [loadNoteAndSections]);

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    try {
      const updatedNote = await updateNote(noteId, {
        title: noteTitle,
        summary: noteSummary,
      });
      setNote(updatedNote);
      setIsEditModalOpen(false);
      toast.success("Note updated successfully!");
    } catch (error) {
      toast.error("Failed to update note");
      console.error(error);
    }
  };

  const handleDeleteNote = async () => {
    try {
      await deleteNote(noteId);
      toast.success("Note deleted successfully!");
      navigate(`/projects/${note.project_id}`);
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const openAddSectionModal = () => {
    setEditingSectionId(null);
    setPageName("");
    setPageDescription("");
    setSelectedFile(null);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();

    try {
      let imagePath = null;

      if (selectedFile) {
        // Upload the image if a file is selected
        imagePath = await uploadImage(selectedFile, `${note.id}`);
      }

      if (editingSectionId) {
        // Update existing section
        const updateData = {
          page_name: pageName,
          description: pageDescription,
        };

        if (imagePath) {
          updateData.image_path = imagePath;
        }

        const updatedSection = await updatePageSection(
          editingSectionId,
          updateData
        );

        // Update the sections array
        setPageSections(
          pageSections.map((section) =>
            section.id === editingSectionId ? updatedSection : section
          )
        );

        // Update the image URL if we have a new one
        if (imagePath) {
          // Generate a direct URL for immediate use
          const directUrl = getDirectImageUrl(imagePath);

          // Use the direct URL if available, otherwise use the path
          const imageUrl = directUrl || imagePath;

          // Store in our URLs state
          setSectionImageUrls((prevUrls) => ({
            ...prevUrls,
            [editingSectionId]: imageUrl,
          }));
        }

        toast.success("Section updated successfully!");
      } else {
        // Create new section
        const newSection = await createPageSection({
          note_id: noteId,
          page_name: pageName,
          description: pageDescription,
          image_path: imagePath,
          order_index: pageSections.length,
        });

        setPageSections([...pageSections, newSection]);

        // Store the image URL for the new section if it has one
        if (imagePath) {
          // Generate a direct URL for immediate use
          const directUrl = getDirectImageUrl(imagePath);

          // Use the direct URL if available, otherwise use the path
          const imageUrl = directUrl || imagePath;

          // Store in our URLs state
          setSectionImageUrls((prevUrls) => ({
            ...prevUrls,
            [newSection.id]: imageUrl,
          }));
        }

        toast.success("Section added successfully!");
      }

      // Reset form and close modal
      setIsSectionModalOpen(false);
      setPageName("");
      setPageDescription("");
      setSelectedFile(null);
      setEditingSectionId(null);
    } catch (error) {
      toast.error(
        editingSectionId ? "Failed to update section" : "Failed to add section"
      );
      console.error(error);
    }
  };
  const handleDeleteSection = async (sectionId) => {
    try {
      await deletePageSection(sectionId);
      setPageSections(
        pageSections.filter((section) => section.id !== sectionId)
      );

      // Clean up the image URL from state
      setSectionImageUrls((prevUrls) => {
        const newUrls = { ...prevUrls };
        delete newUrls[sectionId];
        return newUrls;
      });

      toast.success("Section deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete section");
      console.error(error);
    }
  };

  // Quick add a new section without going through the modal
  const quickAddSection = async () => {
    try {
      // Create a new section with default values
      const newSection = await createPageSection({
        note_id: noteId,
        page_name: "New Section",
        description: "",
        order_index: pageSections.length,
      });

      setPageSections([...pageSections, newSection]);
      toast.success("Section added! Click to edit.");
    } catch (error) {
      toast.error("Failed to add section");
      console.error(error);
    }
  };

  // Update a section in Google Keep style (called from EditablePageSection)
  const handleUpdateSection = async (sectionId, updates) => {
    try {
      const updatedSection = await updatePageSection(sectionId, updates);

      // Update the sections array
      setPageSections(
        pageSections.map((section) =>
          section.id === sectionId ? updatedSection : section
        )
      );

      // Update the image URL if we have a new one
      if (updates.image_path) {
        // Generate a direct URL for immediate use
        const directUrl = getDirectImageUrl(updates.image_path);

        // Store in our URLs state
        setSectionImageUrls((prevUrls) => ({
          ...prevUrls,
          [sectionId]: directUrl || updates.image_path,
        }));
      }

      return true;
    } catch (error) {
      console.error(error);
      toast.error("Failed to update section");
      return false;
    }
  };

  // Handle scroll events to update current page
  useEffect(() => {
    const handleScroll = () => {
      if (!mainContentRef.current) return;

      const sections = document.querySelectorAll(".page-section-card-wrapper");
      if (!sections.length) return;
      const viewportHeight = mainContentRef.current.clientHeight;

      // Find which section is most visible in the viewport
      let maxVisibleSection = 0;
      let maxVisibility = 0;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top - mainContentRef.current.offsetTop;
        const sectionBottom = rect.bottom - mainContentRef.current.offsetTop;

        // Calculate how much of the section is visible
        const visibleTop = Math.max(0, sectionTop);
        const visibleBottom = Math.min(viewportHeight, sectionBottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        if (visibleHeight > maxVisibility) {
          maxVisibility = visibleHeight;
          maxVisibleSection = index;
        }
      });

      setCurrentPage(maxVisibleSection);
    };

    const content = mainContentRef.current;
    if (content) {
      content.addEventListener("scroll", handleScroll);
      // Initialize current page
      handleScroll();
    }

    return () => {
      if (content) {
        content.removeEventListener("scroll", handleScroll);
      }
    };
  }, [pageSections.length]);
  // Navigate to specific page/section
  const navigateToPage = useCallback((index) => {
    setCurrentPage(index);
  }, []);

  // Navigate to previous page
  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    const totalPages = pageSections.length + 1; // +1 for the "add new slide" button
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [pageSections.length]);
  // Add keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't navigate if we're in an input, textarea or editing mode
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        document.querySelector(".page-section-card.editing")
      ) {
        return;
      }

      // Arrow Up or Page Up to navigate to previous page
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToPrevPage();
      }

      // Arrow Down or Page Down to navigate to next page
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToNextPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToPrevPage, goToNextPage]);

  if (isLoading) {
    return <div>Loading note...</div>;
  }

  return (
    <div className="note-details-container">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-title-row">
              <Link to={`/projects/${note.project_id}`} className="back-link">
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
                Back to Project
              </Link>
              <h1 className="note-title">{note.title}</h1>
            </div>
            {note.summary && <p className="note-summary">{note.summary}</p>}
          </div>
          <div className="header-buttons">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-secondary"
            >
              Edit
            </button>
            <button onClick={openAddSectionModal} className="btn btn-primary">
              Add Section
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>{" "}
      </header>
      <main className="powerpoint-layout" ref={mainContentRef}>
        {/* Thumbnails sidebar */}
        <SectionThumbnails
          sections={pageSections.map((section) => ({
            ...section,
            imageUrl: sectionImageUrls[section.id] || section.image_path,
          }))}
          currentPage={currentPage}
          onPageSelect={navigateToPage}
          addNewSection={quickAddSection}
        />

        {/* Main presentation area */}
        <div className="presentation-area">
          {/* Top toolbar */}
          <div className="presentation-toolbar">
            <div className="slide-title">
              {pageSections.length > 0 && currentPage < pageSections.length
                ? pageSections[currentPage].page_name
                : currentPage === pageSections.length
                ? "Add New Slide"
                : ""}
            </div>
          </div>

          {/* Main slides container */}
          <div className="slides-container">
            {pageSections.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-message">
                  No slides yet. Add your first slide to get started.
                </p>
                <button
                  onClick={openAddSectionModal}
                  className="btn btn-primary"
                >
                  Add your first slide
                </button>
              </div>
            ) : (
              <>
                {pageSections.map((section, index) => (
                  <div
                    key={section.id}
                    data-section-index={index + 1}
                    className={`slide ${
                      index === currentPage
                        ? "active"
                        : index < currentPage
                        ? "prev"
                        : ""
                    }`}
                  >
                    <div className="slide-content-wrapper">
                      <EditablePageSection
                        section={section}
                        imageUrl={
                          sectionImageUrls[section.id] || section.image_path
                        }
                        onUpdate={handleUpdateSection}
                        onDelete={handleDeleteSection}
                        noteId={noteId}
                        sectionIndex={index + 1}
                      />
                    </div>
                  </div>
                ))}

                {/* Add new section slide */}
                <div
                  className={`slide ${
                    currentPage === pageSections.length ? "active" : ""
                  }`}
                  data-section-index={pageSections.length + 1}
                >
                  <div className="slide-content-wrapper">
                    <div className="new-section-card" onClick={quickAddSection}>
                      <div className="new-section-icon">+</div>
                      <div className="new-section-text">Add New Slide</div>
                    </div>
                  </div>
                </div>
              </>
            )}{" "}
          </div>
        </div>
        {/* Mobile navigation controls (only shown when there are sections) */}
        {pageSections.length > 0 && (
          <div className="mobile-controls">
            <PageNavigation
              currentPage={currentPage}
              totalPages={pageSections.length + 1}
              navigateToPage={navigateToPage}
              goToPrevPage={goToPrevPage}
              goToNextPage={goToNextPage}
            />
          </div>
        )}
      </main>
      {/* Edit Note Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Edit Note</h3>
            <form onSubmit={handleUpdateNote}>
              <div className="form-group">
                <label htmlFor="edit-title" className="form-label">
                  Title
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-summary" className="form-label">
                  Summary (optional)
                </label>
                <textarea
                  id="edit-summary"
                  value={noteSummary}
                  onChange={(e) => setNoteSummary(e.target.value)}
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
      {/* Delete Note Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Delete Note</h3>
            <p className="form-group">
              Are you sure you want to delete this note? This action cannot be
              undone and all sections will be permanently deleted.
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
                onClick={handleDeleteNote}
                className="btn btn-danger"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit Section Modal */}
      {isSectionModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">
              {editingSectionId ? "Edit Section" : "Add Section"}
            </h3>
            <form onSubmit={handleSaveSection}>
              <div className="form-group">
                <label htmlFor="page-name" className="form-label">
                  Section Name
                </label>
                <input
                  type="text"
                  id="page-name"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  required
                  placeholder="e.g., Homepage Hero Section"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="page-description" className="form-label">
                  Description
                </label>
                <textarea
                  id="page-description"
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the purpose and function of this section"
                  className="form-textarea"
                />
              </div>
              <div className="form-group">
                <label htmlFor="image-upload" className="form-label">
                  Wireframe Image (optional)
                </label>
                <input
                  type="file"
                  id="image-upload"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="form-input"
                />
                {selectedFile && (
                  <div className="selected-file">
                    Selected: {selectedFile.name}
                  </div>
                )}
                {editingSectionId && !selectedFile && (
                  <p className="form-help">
                    Leave empty to keep the current image.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSectionId ? "Save Changes" : "Add Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Pagination Controls */}
    </div>
  );
}

export default NoteDetails;
