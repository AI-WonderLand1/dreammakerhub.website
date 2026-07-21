import { supabaseServer } from "@/lib/supabaseServer";
import { encrypt, decrypt, generateSSHKeyPair } from "@/lib/security/crypto";
import { logger } from '@/lib/logger';

export interface UserSSHKey {
  publicKey: string;
  privateKey: string;
  generatedAt: string;
}

/**
 * Get or generate a user's SSH keypair tied to their profile.
 * Key is generated on first access and stored encrypted in Supabase.
 */
export async function getUserSSHKey(userId: string, userEmail: string): Promise<UserSSHKey> {
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("ssh_public_key, ssh_private_key_encrypted, ssh_key_generated_at")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  // If user already has an SSH key, decrypt and return it
  if (data?.ssh_public_key && data?.ssh_private_key_encrypted) {
    const privateKey = decrypt(data.ssh_private_key_encrypted);
    return {
      publicKey: data.ssh_public_key,
      privateKey,
      generatedAt: data.ssh_key_generated_at,
    };
  }

  // Generate new SSH keypair for this user
  const comment = userEmail || userId;
  const { publicKey, privateKey } = generateSSHKeyPair(comment);
  const encryptedPrivateKey = encrypt(privateKey);

  // Store in profiles
  const { error: updateError } = await supabaseServer
    .from("profiles")
    .update({
      ssh_public_key: publicKey,
      ssh_private_key_encrypted: encryptedPrivateKey,
      ssh_key_generated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    throw new Error(`Failed to store SSH key: ${updateError.message}`);
  }

  return {
    publicKey,
    privateKey,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get just the public key for a user (used for Coder workspace injection)
 */
export async function getUserSSHPublicKey(userId: string, userEmail: string): Promise<string> {
  const key = await getUserSSHKey(userId, userEmail);
  return key.publicKey;
}
