import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { uploadImage, getDirectImageUrl } from "../services/projectService";

function EditablePageSection({
  section,
  imageUrl,
  onUpdate,
  onDelete,
  noteId,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(section.page_name);
  const [description, setDescription] = useState(section.description || "");
  const [image, setImage] = useState(imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  // Save changes when user clicks outside
  const saveChanges = useCallback(async () => {
    if (isSaving) return;

    if (
      name !== section.page_name ||
      description !== (section.description || "")
    ) {
      setIsSaving(true);

      // Only update if changes were made
      await onUpdate(section.id, {
        page_name: name,
        description,
      });

      setIsSaving(false);
    }

    // Exit edit mode
    setIsEditing(false);
  }, [name, description, section, isSaving, onUpdate, setIsEditing]);

  // Set up click-outside handler to save changes
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isEditing &&
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        saveChanges();
      }
    }

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, saveChanges]);

  // Set the content from props
  useEffect(() => {
    setName(section.page_name);
    setDescription(section.description || "");
    setImage(imageUrl);
  }, [section, imageUrl]);

  // Handle paste events to capture images
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        e.preventDefault();
        const file = item.getAsFile();

        try {
          setIsSaving(true);
          // Upload image to Supabase
          const imagePath = await uploadImage(file, `${noteId}`);

          // Get direct URL for immediate display
          const directUrl = getDirectImageUrl(imagePath);
          setImage(directUrl);

          // Update the section with the new image
          await onUpdate(section.id, {
            page_name: name,
            description,
            image_path: imagePath,
          });
        } catch (error) {
          console.error("Failed to upload pasted image:", error);
        } finally {
          setIsSaving(false);
        }

        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`page-section-card ${isEditing ? "editing" : ""} ${
        isSaving ? "saving" : ""
      }`}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <div className="section-content">
        <div className="section-image-container">
          {image ? (
            <img
              src={image}
              alt={name}
              className="wireframe-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOHB4IiBmaWxsPSIjOWNhM2FmIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==";
                e.target.classList.add("image-error");
              }}
            />
          ) : (
            <div
              className="image-placeholder"
              title="Paste an image here or click to upload"
            >
              {isEditing ? "Paste image or click to upload" : "No image"}
            </div>
          )}

          {/* Only show file input when editing */}
          {isEditing && (
            <input
              type="file"
              className="file-input-overlay"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  try {
                    setIsSaving(true);
                    const imagePath = await uploadImage(file, `${noteId}`);
                    const directUrl = getDirectImageUrl(imagePath);
                    setImage(directUrl);

                    await onUpdate(section.id, {
                      page_name: name,
                      description,
                      image_path: imagePath,
                    });
                  } catch (error) {
                    console.error("Failed to upload image:", error);
                  } finally {
                    setIsSaving(false);
                  }
                }
              }}
              accept="image/*"
            />
          )}
        </div>

        <div ref={contentRef} className="section-text" onPaste={handlePaste}>
          {isEditing ? (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="section-name-input"
                placeholder="Section name"
                autoFocus
              />{" "}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="section-description-input"
                placeholder="Describe this section or paste content here..."
                rows={6}
              />
              <div className="edit-indicator">
                {isSaving ? "Saving..." : "Click outside to save"}
              </div>
            </>
          ) : (
            <>
              <h3 className="section-name">{name}</h3>
              <p className="section-description">
                {description || "No description"}
              </p>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="section-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(false);
            }}
            className="btn btn-secondary"
          >
            Done
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (
                window.confirm("Are you sure you want to delete this section?")
              ) {
                onDelete(section.id);
              }
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

EditablePageSection.propTypes = {
  section: PropTypes.object.isRequired,
  imageUrl: PropTypes.string,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  noteId: PropTypes.string.isRequired,
};

export default EditablePageSection;
