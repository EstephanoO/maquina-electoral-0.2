import { create } from "zustand";
import type { AssetFile, AssetFolder } from "@/lib/types";
import { assetFiles, assetFolders } from "@/db/constants";
import { createId } from "@/db/mock-helpers";

type AssetsState = {
  folders: AssetFolder[];
  files: AssetFile[];
  activeFolderId: string;
};

type AssetsActions = {
  setActiveFolder: (folderId: string) => void;
  createFolder: (name: string, parentId?: string) => void;
  uploadFileMock: (folderId: string, name: string) => void;
  addCommentMock: (fileId: string, comment: string) => void;
  bumpVersion: (fileId: string) => void;
};

export const useAssetsStore = create<AssetsState & AssetsActions>()(
  (set) => ({
    folders: assetFolders,
    files: assetFiles,
    activeFolderId: "folder-root",
    setActiveFolder: (folderId) => set({ activeFolderId: folderId }),
    createFolder: (name, parentId) =>
      set((state) => ({
        folders: [
          ...state.folders,
          { id: createId("folder"), name, parentId },
        ],
      })),
    uploadFileMock: (folderId, name) =>
      set((state) => ({
        files: [
          ...state.files,
          {
            id: createId("file"),
            folderId,
            name,
            type: "mock",
            version: 1,
            updatedAt: new Date().toISOString().slice(0, 10),
            comments: [],
          },
        ],
      })),
    addCommentMock: (fileId, comment) =>
      set((state) => ({
        files: state.files.map((file) =>
          file.id === fileId
            ? { ...file, comments: [...file.comments, comment] }
            : file,
        ),
      })),
    bumpVersion: (fileId) =>
      set((state) => ({
        files: state.files.map((file) =>
          file.id === fileId
            ? {
                ...file,
                version: file.version + 1,
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : file,
        ),
      })),
  }),
);
