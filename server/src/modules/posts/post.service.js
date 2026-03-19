import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildPaginationMeta } from '../../utils/pagination.js';
import { slugify } from '../../utils/slugify.js';
import {
  buildUploadedImageUrl,
  cleanupUploadedFiles,
  deleteStoredPostImages
} from './post.upload.js';

const PUBLIC_LIST_STATUSES = ['ACTIVE'];
const PUBLIC_DETAIL_STATUSES = ['ACTIVE', 'SOLD'];

const postListInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  user: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      status: true
    }
  },
  images: {
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    select: {
      id: true,
      imageUrl: true,
      isPrimary: true,
      sortOrder: true
    }
  }
};

const buildSearchFilter = ({ q, category, city }) => {
  const filters = [];

  if (q) {
    filters.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    });
  }

  if (category) {
    filters.push({
      OR: [{ categoryId: category }, { category: { slug: category } }]
    });
  }

  if (city) {
    filters.push({
      city: { contains: city, mode: 'insensitive' }
    });
  }

  return filters;
};

const ensureCategoryExists = async (categoryId) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });

  if (!category) {
    throw new ApiError(400, 'Selected category does not exist.');
  }
};

const ensureUniqueSlug = async (title, excludePostId) => {
  const baseSlug = slugify(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingPost = await prisma.post.findFirst({
      where: {
        slug: candidate,
        ...(excludePostId ? { NOT: { id: excludePostId } } : {})
      },
      select: { id: true }
    });

    if (!existingPost) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const isPubliclyVisiblePost = (post) =>
  PUBLIC_DETAIL_STATUSES.includes(post.status) && post.user.status === 'ACTIVE';

const canViewPost = (post, viewer) => {
  if (isPubliclyVisiblePost(post)) {
    return true;
  }

  if (!viewer) {
    return false;
  }

  return viewer.role === 'ADMIN' || viewer.id === post.userId;
};

const sanitizePostPayload = (payload) => ({
  ...payload,
  ...(Object.prototype.hasOwnProperty.call(payload, 'price')
    ? { price: payload.price ?? null }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(payload, 'country')
    ? { country: payload.country ?? null }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(payload, 'city')
    ? { city: payload.city ?? null }
    : {})
});

const ensureImagePayloadConsistency = ({ newImageKeys = [], coverImageKey, uploadedFiles = [] }) => {
  if (newImageKeys.length !== uploadedFiles.length) {
    throw new ApiError(400, 'Uploaded image payload is inconsistent.');
  }

  if (coverImageKey && !newImageKeys.includes(coverImageKey) && !coverImageKey.startsWith('existing:')) {
    throw new ApiError(400, 'Cover image selection is invalid.');
  }
};

const buildNewImageRecords = ({ newImageKeys = [], uploadedFiles = [] }) =>
  newImageKeys.map((imageKey, index) => ({
    key: imageKey,
    imageUrl: buildUploadedImageUrl(uploadedFiles[index])
  }));

const buildOrderedImagePlan = ({ existingImages = [], newImages = [], removedImageIds = [], coverImageKey }) => {
  const keptExistingImages = existingImages
    .filter((image) => !removedImageIds.includes(image.id))
    .map((image) => ({
      key: `existing:${image.id}`,
      id: image.id,
      imageUrl: image.imageUrl,
      source: 'existing'
    }));

  const combinedImages = [...keptExistingImages, ...newImages.map((image) => ({ ...image, source: 'new' }))];

  if (combinedImages.length === 0) {
    return [];
  }

  const primaryImageKey = combinedImages.some((image) => image.key === coverImageKey)
    ? coverImageKey
    : combinedImages[0].key;

  const orderedImages = [
    combinedImages.find((image) => image.key === primaryImageKey),
    ...combinedImages.filter((image) => image.key !== primaryImageKey)
  ].filter(Boolean);

  return orderedImages.map((image, index) => ({
    ...image,
    sortOrder: index,
    isPrimary: index === 0
  }));
};

export const listPosts = async ({ q, category, city, page, limit }) => {
  const where = {
    AND: [
      { status: { in: PUBLIC_LIST_STATUSES } },
      { user: { status: 'ACTIVE' } },
      ...buildSearchFilter({ q, category, city })
    ]
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postListInclude,
      orderBy: [{ createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.post.count({ where })
  ]);

  return {
    data: posts,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const listMyPosts = async (userId, { q, category, city, page, limit, status }) => {
  const where = {
    AND: [
      { userId },
      ...(status ? [{ status }] : []),
      ...buildSearchFilter({ q, category, city })
    ]
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postListInclude,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.post.count({ where })
  ]);

  return {
    data: posts,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const getPostByIdentifier = async (identifier, viewer) => {
  const post = await prisma.post.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }]
    },
    include: {
      ...postListInclude,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          status: true
        }
      }
    }
  });

  if (!post || !canViewPost(post, viewer)) {
    throw new ApiError(404, 'Post not found.');
  }

  return post;
};

const getOwnedPost = async (identifier) =>
  prisma.post.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }]
    },
    select: {
      id: true,
      userId: true,
      title: true
    }
  });

const ensurePostOwner = (post, user) => {
  if (!post) {
    throw new ApiError(404, 'Post not found.');
  }

  if (user.role === 'ADMIN' || post.userId === user.id) {
    return;
  }

  throw new ApiError(403, 'You can only manage your own posts.');
};

export const createPost = async (user, payload, uploadedFiles = []) => {
  ensureImagePayloadConsistency({
    newImageKeys: payload.newImageKeys,
    coverImageKey: payload.coverImageKey,
    uploadedFiles
  });

  await ensureCategoryExists(payload.categoryId);
  const slug = await ensureUniqueSlug(payload.title);
  const sanitized = sanitizePostPayload(payload);
  const orderedImages = buildOrderedImagePlan({
    newImages: buildNewImageRecords({
      newImageKeys: sanitized.newImageKeys,
      uploadedFiles
    }),
    coverImageKey: sanitized.coverImageKey
  });

  try {
    return await prisma.post.create({
      data: {
        userId: user.id,
        title: sanitized.title,
        slug,
        description: sanitized.description,
        price: sanitized.price,
        country: sanitized.country,
        city: sanitized.city,
        categoryId: sanitized.categoryId,
        status: sanitized.status,
        ...(orderedImages.length > 0
          ? {
              images: {
                create: orderedImages.map((image) => ({
                  imageUrl: image.imageUrl,
                  isPrimary: image.isPrimary,
                  sortOrder: image.sortOrder
                }))
              }
            }
          : {})
      },
      include: postListInclude
    });
  } catch (error) {
    await cleanupUploadedFiles(uploadedFiles);
    throw error;
  }
};

export const updatePost = async (identifier, user, payload, uploadedFiles = []) => {
  ensureImagePayloadConsistency({
    newImageKeys: payload.newImageKeys,
    coverImageKey: payload.coverImageKey,
    uploadedFiles
  });

  const existingPost = await prisma.post.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }]
    },
    select: {
      id: true,
      userId: true,
      title: true,
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        select: {
          id: true,
          imageUrl: true,
          isPrimary: true,
          sortOrder: true
        }
      }
    }
  });
  ensurePostOwner(existingPost, user);

  if (payload.categoryId) {
    await ensureCategoryExists(payload.categoryId);
  }

  const nextTitle = payload.title ?? existingPost.title;
  const nextSlug = await ensureUniqueSlug(nextTitle, existingPost.id);
  const sanitized = sanitizePostPayload(payload);
  const removedImageIds = sanitized.removedImageIds || [];
  const removedImages = existingPost.images.filter((image) => removedImageIds.includes(image.id));
  const orderedImages = buildOrderedImagePlan({
    existingImages: existingPost.images,
    newImages: buildNewImageRecords({
      newImageKeys: sanitized.newImageKeys,
      uploadedFiles
    }),
    removedImageIds,
    coverImageKey: sanitized.coverImageKey
  });

  try {
    const updatedPost = await prisma.$transaction(async (transaction) => {
      if (removedImageIds.length > 0) {
        await transaction.postImage.deleteMany({
          where: {
            postId: existingPost.id,
            id: { in: removedImageIds }
          }
        });
      }

      if (orderedImages.some((entry) => entry.source === 'existing')) {
        await transaction.postImage.updateMany({
          where: {
            postId: existingPost.id,
            id: {
              notIn: removedImageIds
            }
          },
          data: {
            isPrimary: false,
            sortOrder: {
              increment: 1000
            }
          }
        });
      }

      for (const image of orderedImages.filter((entry) => entry.source === 'existing')) {
        await transaction.postImage.update({
          where: { id: image.id },
          data: {
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder
          }
        });
      }

      const newImages = orderedImages.filter((entry) => entry.source === 'new');

      if (newImages.length > 0) {
        await transaction.postImage.createMany({
          data: newImages.map((image) => ({
            postId: existingPost.id,
            imageUrl: image.imageUrl,
            isPrimary: image.isPrimary,
            sortOrder: image.sortOrder
          }))
        });
      }

      return transaction.post.update({
        where: { id: existingPost.id },
        data: {
          ...(sanitized.title ? { title: sanitized.title } : {}),
          ...(sanitized.description ? { description: sanitized.description } : {}),
          ...(Object.prototype.hasOwnProperty.call(sanitized, 'price')
            ? { price: sanitized.price }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(sanitized, 'country')
            ? { country: sanitized.country }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(sanitized, 'city')
            ? { city: sanitized.city }
            : {}),
          ...(sanitized.categoryId ? { categoryId: sanitized.categoryId } : {}),
          ...(sanitized.status ? { status: sanitized.status } : {}),
          slug: nextSlug
        },
        include: postListInclude
      });
    });

    await deleteStoredPostImages(removedImages);
    return updatedPost;
  } catch (error) {
    await cleanupUploadedFiles(uploadedFiles);
    throw error;
  }
};

export const deletePost = async (identifier, user) => {
  const existingPost = await prisma.post.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }]
    },
    select: {
      id: true,
      userId: true,
      title: true,
      images: {
        select: {
          id: true,
          imageUrl: true
        }
      }
    }
  });
  ensurePostOwner(existingPost, user);

  await prisma.post.delete({
    where: { id: existingPost.id }
  });

  await deleteStoredPostImages(existingPost.images);
};
