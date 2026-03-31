export const REQUIRED_PUCK_PACKAGES = [
  "@puckeditor/plugin-ai",
  "@puckeditor/cloud-client",
  "zod",
] as const;

export const headingBlockAiSchemaExample = {
  componentName: "HeadingBlock",
  field: "object",
  pseudoCode: `import z from "zod/v4";

const config = {
  components: {
    HeadingBlock: {
      fields: {
        object: {
          type: "custom",
          ai: {
            schema: z.toJSONSchema(
              z.object({
                title: z.string(),
              })
            ),
          },
          render: () => <input />,
        },
      },
      render: ({ object }) => <h1>{object.title}</h1>,
    },
  },
};`,
};

export const cloudToolExamples = {
  puckHandler: `import { puckHandler, tool } from "@puckeditor/cloud-client";
import z from "zod/v4";

const handler = puckHandler({
  ai: {
    tools: {
      getImageUrl: tool({
        description: "Get an image",
        inputSchema: z.object(),
        execute: () => "https://www.example.com/example.png",
        mode: "auto",
      }),
    },
  },
});`,
  bindToField: `const config = {
  components: {
    ImageBlock: {
      fields: {
        src: {
          type: "text",
          ai: {
            bind: "getImageUrl",
          },
        },
      },
    },
  },
};`,
  enumInputTool: `import { tool } from "@puckeditor/cloud-client";
import z from "zod/v4";

const images = {
  dogs: ["http://example.com/dog.png"],
  cats: ["http://example.com/cat.png"],
};

const getImageUrl = tool({
  description: "Get an image",
  inputSchema: z.object({
    category: z.enum(["dogs", "cats"]),
  }),
  execute: ({ category }) => images[category][0],
});`,
  asyncFetchTool: `import { tool } from "@puckeditor/cloud-client";
import z from "zod/v4";

const getImageUrl = tool({
  description: "Get an image",
  inputSchema: z.object(),
  execute: async () => {
    const response = await fetch("https://example.com/api/random-image");
    return await response.json();
  },
});`,
};
