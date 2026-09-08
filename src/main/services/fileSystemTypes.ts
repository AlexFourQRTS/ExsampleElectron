export type FileItemStats = {
  size: number
  createdAt: Date
  updatedAt: Date
  isFile: boolean
  isDirectory: boolean
  extension: string
}

export type FileTreeNode = {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
}
