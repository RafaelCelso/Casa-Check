import AvaliarClient from "./client";

export default async function AvaliarPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <AvaliarClient id={id} />;
}
