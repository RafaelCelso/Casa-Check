import SuccessClient from "./success-client";

export default async function AvaliacaoSucessoPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <SuccessClient id={id} />;
}
