import { TournamentApp } from "@/components/tournament-app";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <TournamentApp publicId={publicId} />;
}
