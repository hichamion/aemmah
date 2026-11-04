// «ملتقى الأئمة» — community space for registered imams.

export type PostType = 'khutba' | 'article' | 'question' | 'field' | 'poll' | 'event';
export type PostStatus = 'draft' | 'published';

export interface PostFile {
  id: string;
  name: string;
  size: number;
}

/** Firestore: posts/{postId} */
export interface CommunityPost {
  id: string;
  authorUid: string;
  authorName: string;
  /** imams/{id} of the author, for the picture ('' for admins). */
  authorImamId: string;
  type: PostType;
  category: string;
  title: string;
  /** Light markup: "## " heading, "- " / "1. " lists, "> " quote, **bold**. */
  body: string;
  /** media/{id} images. */
  images: string[];
  /** files/{id} PDF attachments. */
  files: PostFile[];
  poll: { options: string[] } | null;
  /** Anonymous poll totals, one per option. */
  pollCounts: number[];
  status: PostStatus;
  pinned: boolean;
  inLibrary: boolean;
  libraryCategory: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  lastCommentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

/** Firestore: posts/{postId}/comments/{commentId} */
export interface PostComment {
  id: string;
  authorUid: string;
  authorName: string;
  authorImamId: string;
  body: string;
  /** '' for a top-level comment, otherwise the comment it answers. */
  parentId: string;
  createdAt: string;
}

/** Firestore: users/{uid}/notifications/{id} */
export interface CommunityNotification {
  id: string;
  type: 'comment' | 'reply';
  postId: string;
  postTitle: string;
  fromUid: string;
  fromName: string;
  createdAt: string;
  read: boolean;
}

export interface PostTemplate {
  title: string;
  body: string;
}

/** Firestore: communitySettings/main (admins only write it). */
export interface CommunitySettings {
  postingEnabled: boolean;
  categories: string[];
  libraryCategories: string[];
  /** Per post type; a missing type falls back to the built-in template, null = deleted by an admin. */
  templates: Partial<Record<PostType, PostTemplate | null>>;
}
