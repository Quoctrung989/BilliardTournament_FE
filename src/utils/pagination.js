/** Phân trang server-side — format Spring Page trong ApiResponse.data */

export const DEFAULT_PAGE_SIZE = 9;
export const PAGE_SIZE_OPTIONS = [9, 18, 24];

const emptyPage = (size = DEFAULT_PAGE_SIZE) => ({
  content: [],
  page: 0,
  size,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  numberOfElements: 0,
});

/**
 * Chuẩn hóa data sau getApiData:
 * { content, page, size, totalElements, totalPages, first?, last?, numberOfElements? }
 */
export const parsePagedResponse = (data, fallbackSize = DEFAULT_PAGE_SIZE) => {
  if (!data) return emptyPage(fallbackSize);

  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length || fallbackSize,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      first: true,
      last: true,
      numberOfElements: data.length,
    };
  }

  if (Array.isArray(data.content)) {
    const page = data.page ?? data.number ?? data.pageNumber ?? 0;
    const size = data.size ?? data.pageSize ?? data.pageable?.pageSize ?? fallbackSize;
    const totalElements = data.totalElements ?? data.content.length;
    const totalPages =
      data.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0);

    return {
      content: data.content,
      page,
      size,
      totalElements,
      totalPages,
      first: data.first ?? page <= 0,
      last: data.last ?? page >= totalPages - 1,
      numberOfElements: data.numberOfElements ?? data.content.length,
    };
  }

  return emptyPage(fallbackSize);
};

/** Query: page (0-based), size + filter */
export const buildListParams = ({ page = 0, size = DEFAULT_PAGE_SIZE, ...filters } = {}) => {
  const params = { page, size };
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value;
    }
  });
  return params;
};

export const pageDisplay = (page) => page + 1;
