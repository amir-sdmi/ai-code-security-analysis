// generated with ChatGPT

export function paginate(items, pageNum = 1, pageSize = 10) {
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = pageNum * pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);

    // Return paginated items with metadata
    return {
        items: paginatedItems,
        pageNum,
        totalPages: Math.ceil(items.length / pageSize),
        totalItems: items.length,
    };
}
