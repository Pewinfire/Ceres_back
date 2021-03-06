function getPagination(page, size) {
  const limit = size;
  const offset = page ? page * limit : 0;

  return { limit, offset };
}

module.exports = getPagination;
