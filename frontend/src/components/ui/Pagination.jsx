import Button from "./Button";

export default function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) {
  if (totalItems <= 0) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  return (
    <div className="pagination">
      <p className="pagination-info">
        Showing {start}-{end} of {totalItems}
      </p>

      <div className="pagination-controls">
        <label htmlFor="page-size" className="pagination-size-label">
          Rows
        </label>
        <select
          id="page-size"
          className="input pagination-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <Button
          variant="ghost"
          onClick={() => onPageChange?.(safePage - 1)}
          disabled={safePage <= 1}
        >
          Prev
        </Button>
        <span className="pagination-page">
          Page {safePage} / {safeTotalPages}
        </span>
        <Button
          variant="ghost"
          onClick={() => onPageChange?.(safePage + 1)}
          disabled={safePage >= safeTotalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
