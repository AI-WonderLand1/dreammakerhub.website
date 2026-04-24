// @ts-ignore
import { supabaseServer } from "@/lib/supabaseServer";
// @ts-ignore
import type { EngineType } from "@/types/db";
import { randomUUID } from "crypto";
// @ts-ignore
import { generateSSHKeyPair, encrypt } from "@/lib/security/crypto";

export async function createProject(
  userId: string,
  name: string,
  engine: EngineType
) {
  const projectId = randomUUID();
  const keyComment = `wonder-project-${projectId}`;
  
  const { privateKey, publicKey } = generateSSHKeyPair(keyComment);
  const encryptedPrivateKey = encrypt(privateKey);
  
  const { data: project, error: projectError } = await supabaseServer
    .from("projects")
    .insert({
      id: projectId,
      user_id: userId,
      name,
      engine,
      metadata: {
        sshPublicKey: publicKey,
        runtime: 'wonder-runtime'
      }
    })
    .select()
    .single();

  if (projectError) {
    console.error("Project creation failed:", projectError);
    throw new Error(projectError.message);
  }
  
  const { error: keyError } = await supabaseServer
    .from("project_ssh_keys")
    .insert({
      project_id: projectId,
      private_key_encrypted: encryptedPrivateKey,
      public_key: publicKey,
      key_type: 'ed25519'
    });

  if (keyError) {
    console.error("SSH key storage failed:", keyError);
    throw new Error(keyError.message);
  }

  return {
    ...project,
    sshPublicKey: publicKey,
    runtimeUrl: `https://${projectId}.${process.env.RUNTIME_DOMAIN || 'wonder.dev'}`
  };
}