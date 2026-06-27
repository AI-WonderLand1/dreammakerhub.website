import StudioClient from "./StudioClient";

async function getData() {
  return {
    content: [{ type: "HeadingBlock", props: { title: "AI Wonderland" } }],
  };
}

export default async function WonderBuildStudioPage() {
  const initialData = await getData();
  return <StudioClient initialData={initialData} />;
}
