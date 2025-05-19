import PropTypes from "prop-types";

function SectionThumbnails({
  sections,
  currentPage,
  onPageSelect,
  addNewSection,
}) {
  return (
    <div className="section-thumbnails-sidebar">
      <div className="thumbnails-header">
        <h3>Slides</h3>
        <button
          className="add-slide-btn"
          onClick={addNewSection}
          title="Add new slide"
        >
          <span className="add-slide-icon">+</span> Add Slide
        </button>
      </div>

      <div className="thumbnails-list">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`section-thumbnail ${
              currentPage === index ? "active" : ""
            }`}
            onClick={() => onPageSelect(index)}
          >
            <div className="thumbnail-number">{index + 1}</div>
            <div className="thumbnail-preview">
              {section.image_path && (
                <img
                  src={section.imageUrl || section.image_path}
                  alt={section.page_name}
                  className="thumbnail-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOHB4IiBmaWxsPSIjOWNhM2FmIj5JbWFnZTwvdGV4dD48L3N2Zz4=";
                  }}
                />
              )}
              {!section.image_path && (
                <div className="thumbnail-placeholder">No Image</div>
              )}
            </div>
            <div className="thumbnail-title">{section.page_name}</div>
          </div>
        ))}

        <div className="section-thumbnail add-new" onClick={addNewSection}>
          <div className="thumbnail-number">+</div>
          <div className="thumbnail-preview add-preview">
            <div className="add-icon">+</div>
          </div>
          <div className="thumbnail-title">New Slide</div>
        </div>
      </div>
    </div>
  );
}

SectionThumbnails.propTypes = {
  sections: PropTypes.array.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageSelect: PropTypes.func.isRequired,
  addNewSection: PropTypes.func.isRequired,
};

export default SectionThumbnails;
