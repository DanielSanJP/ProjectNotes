import PropTypes from "prop-types";

function PageNavigation({
  currentPage,
  totalPages,
  navigateToPage,
  goToPrevPage,
  goToNextPage,
}) {
  return (
    <>
      {/* Mobile vertical navigation */}
      <div className="page-navigation">
        <button
          className="page-nav-btn"
          onClick={goToPrevPage}
          aria-label="Previous slide"
          disabled={currentPage === 0}
        >
          ↑
        </button>

        <div className="page-indicators">
          {[...Array(totalPages)].map((_, index) => (
            <div
              key={index}
              className={`page-indicator ${
                currentPage === index ? "active" : ""
              }`}
              onClick={() => navigateToPage(index)}
              role="button"
              aria-label={`Go to slide ${index + 1}`}
            ></div>
          ))}
        </div>

        <button
          className="page-nav-btn"
          onClick={goToNextPage}
          aria-label="Next slide"
          disabled={currentPage === totalPages - 1}
        >
          ↓
        </button>
      </div>
    </>
  );
}

PageNavigation.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  navigateToPage: PropTypes.func.isRequired,
  goToPrevPage: PropTypes.func.isRequired,
  goToNextPage: PropTypes.func.isRequired,
};

export default PageNavigation;
