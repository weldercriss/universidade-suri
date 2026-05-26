export interface Course {
  id: string;
  title: string;
  description: string;
  cover: string;
  group: string;
  progress: number;
  lessons: {
    id: string;
    title: string;
    duration: string;
    youtubeId: string;
    done: boolean;
  }[];
}
