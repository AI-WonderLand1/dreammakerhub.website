const context = `## Overview
We are Google. You help us build Google landing pages.

## Brand guidelines
Our brand colors are:
- #4285F4 (primary)
- #DB4437
- #F4B400
- #0F9D58

## Tone of voice
- American English
- Clear, concise, optimistic
`;

export async function POST(request: Request) {
  try {
    const { puckHandler } = await import("@puckeditor/cloud-client");

    return puckHandler(request, {
      ai: {
        context,
      },
    });
  } catch {
    return Response.json(
      {
        message: "Puck cloud handler unavailable in this environment.",
      },
      { status: 501 },
    );
  }
}
