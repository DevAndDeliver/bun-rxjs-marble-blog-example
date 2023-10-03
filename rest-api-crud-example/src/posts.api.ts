import { HttpError, HttpStatus, combineRoutes, r } from "@marblejs/http";
import { of } from "rxjs";
import { map, mergeMap, tap } from "rxjs/operators";

export interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

export type PostCreateDto = Pick<Post, "title" | "content">;
export type PostUpdateDto = Pick<Post, "title" | "content">;

const posts: Post[] = [];
let lastID = 0;

const readPosts = () => {
  return of(posts);
}

const readPosts$ = r.pipe(
  r.matchPath("/"),
  r.matchType("GET"),
  r.useEffect((req$) =>
    req$.pipe(
      mergeMap(readPosts),
      map((body) => ({ body }))
    )
  )
);

const createPost = (input: PostCreateDto) => {
  const post: Post = {
    id: ++lastID,
    title: input.title,
    content: input.content,
    createdAt: new Date(),
  };
  posts.push(post);
  return of(post);
};

const createPost$ = r.pipe(
  r.matchPath("/"),
  r.matchType("POST"),
  r.useEffect((req$) =>
    req$.pipe(
      mergeMap((req) => createPost(req.body as PostCreateDto)),
      map((body) => ({ body }))
    )
  )
);

const updatePost = (postID: number, input: PostUpdateDto) => {
  console.log(postID);
  const index = posts.findIndex((p) => p.id == postID);
  if (index >= 0) {
    posts[index].title = input.title;
    posts[index].content = input.content;
    return of(posts[index]);
  }
  throw new HttpError(`Post ${postID} not found`, HttpStatus.NOT_FOUND);
};

const updatePost$ = r.pipe(
  r.matchPath("/:id"),
  r.matchType("PUT"),
  r.useEffect((req$) =>
    req$.pipe(
      map((req) => req as typeof req & { params: { id: number } }),
      mergeMap((req) => updatePost(req.params.id, req.body as PostUpdateDto)),
      map((body) => ({ body }))
    )
  )
);

const deletePost = (postID: number) => {
  const index = posts.findIndex((p) => p.id == postID);
  if (index >= 0) {
    const id = posts[index].id;
    posts.splice(index, 1);
    return of(id);
  }
  throw new HttpError(`Post ${postID} not found`, HttpStatus.NOT_FOUND);
};

const deletePost$ = r.pipe(
  r.matchPath("/:id"),
  r.matchType("DELETE"),
  r.useEffect((req$) =>
    req$.pipe(
      map((req) => req as typeof req & { params: { id: number } }),
      map((req) => req.params.id),
      mergeMap(deletePost),
      map((id) => ({ body: { id } }))
    )
  )
);

export const postsApi$ = combineRoutes("/posts", [
  readPosts$,
  createPost$,
  updatePost$,
  deletePost$,
]);
