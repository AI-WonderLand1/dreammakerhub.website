import { describe, expect, it } from 'vitest';
import { secureCoderApiOrigin } from '../apps/web/lib/coder/secure-origin';

describe('Coder API token origin protection', () => {
  it('denies public plaintext HTTP even when it resolves to the correct IP', () => {
    expect(() => secureCoderApiOrigin('http://212.2.240.19.nip.io')).toThrow(/HTTPS/);
    expect(() => secureCoderApiOrigin('http://coder.example.com')).toThrow(/HTTPS/);
    expect(() => secureCoderApiOrigin('http://8.8.8.8')).toThrow(/HTTPS/);
  });
  it('allows private in-cluster HTTP and normal HTTPS origins', () => {
    expect(secureCoderApiOrigin('http://coder.coder.svc.cluster.local/')).toBe('http://coder.coder.svc.cluster.local');
    expect(secureCoderApiOrigin('http://10.0.1.10')).toBe('http://10.0.1.10');
    expect(secureCoderApiOrigin('https://coder.dreammakerhub.website/')).toBe('https://coder.dreammakerhub.website');
  });
  it('rejects URL credentials, API paths and non-HTTP protocols', () => {
    expect(() => secureCoderApiOrigin('https://user:token@coder.example.com')).toThrow();
    expect(() => secureCoderApiOrigin('https://coder.example.com/api/v2')).toThrow();
    expect(() => secureCoderApiOrigin('file:///etc/passwd')).toThrow();
  });
});
