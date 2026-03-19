import { Router } from 'express';

import { listCategoriesController } from './category.controller.js';

const router = Router();

router.get('/', listCategoriesController);

export default router;
