import { prisma } from '../../db/prisma.js';

export const listCategories = () =>
  prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          posts: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
