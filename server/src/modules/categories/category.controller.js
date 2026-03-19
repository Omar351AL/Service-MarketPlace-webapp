import { asyncHandler } from '../../utils/asyncHandler.js';

import { listCategories } from './category.service.js';

export const listCategoriesController = asyncHandler(async (_req, res) => {
  const categories = await listCategories();

  res.json({
    data: categories
  });
});
