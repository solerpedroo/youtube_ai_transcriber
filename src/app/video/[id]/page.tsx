import { VideoWorkspace } from "@/components/transcription/video-workspace";

export default async function VideoWorkspacePage({ params }: PageProps<"/video/[id]">) {
  const { id } = await params;
  return <VideoWorkspace projectId={id} />;
}
