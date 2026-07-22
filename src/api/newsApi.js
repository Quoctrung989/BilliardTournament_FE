import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (p) => p.then((r) => getApiData(r));
const unwrapPaged = (p, size) => p.then((r) => parsePagedResponse(getApiData(r), size));

/* ── Public ── */
export const listPublishedPosts = (params) =>
  unwrapPaged(axiosClient.get("/news", { params }));

export const getPostBySlug = (slug) =>
  unwrap(axiosClient.get(`/news/${slug}`));

export const listPublicCategories = () =>
  unwrap(axiosClient.get("/news/categories"));

/* ── CMS (Owner/Manager) ── */
export const createNewsCmsApi = (scope) => ({
  listPosts:      (params)         => unwrapPaged(axiosClient.get(`/${scope}/news`, { params })),
  getPost:        (id)             => unwrap(axiosClient.get(`/${scope}/news/${id}`)),
  createPost:     (body)           => unwrap(axiosClient.post(`/${scope}/news`, body)),
  updatePost:     (id, body)       => unwrap(axiosClient.put(`/${scope}/news/${id}`, body)),
  publishPost:    (id)             => unwrap(axiosClient.post(`/${scope}/news/${id}/publish`, {})),
  hidePost:       (id)             => unwrap(axiosClient.post(`/${scope}/news/${id}/hide`, {})),
  deletePost:     (id)             => unwrap(axiosClient.delete(`/${scope}/news/${id}`)),
  listCategories: ()               => unwrap(axiosClient.get(`/${scope}/news/categories`)),
  createCategory: (body)           => unwrap(axiosClient.post(`/${scope}/news/categories`, body)),
  updateCategory: (id, body)       => unwrap(axiosClient.put(`/${scope}/news/categories/${id}`, body)),
  setCategoryStatus: (id, status)  => unwrap(axiosClient.patch(`/${scope}/news/categories/${id}/status`, null, { params: { status } })),
});

export const ownerNewsCmsApi   = createNewsCmsApi("owner");
export const managerNewsCmsApi = createNewsCmsApi("manager");

/* ── Tags (shared Owner/Manager) ── */
export const newsTagsApi = {
  listTags:   ()           => unwrap(axiosClient.get("/shared/news/tags")),
  createTag:  (body)       => unwrap(axiosClient.post("/shared/news/tags", body)),
  updateTag:  (id, body)   => unwrap(axiosClient.put(`/shared/news/tags/${id}`, body)),
  deleteTag:  (id)         => unwrap(axiosClient.delete(`/shared/news/tags/${id}`)),
};
