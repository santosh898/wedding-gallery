export interface Photo {
  filename: string;
  path: string;
  liked: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  photoId: string;
  text: string;
  userName: string;
  timestamp: number;
}