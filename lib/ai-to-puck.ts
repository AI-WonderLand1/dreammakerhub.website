export function htmlToPuckBlocks(html: string) {
  // Stub: just return the HTML as a mock block
  return { type: 'html', content: html };
}

export function storePuckData(data: any) {
  // Store in sessionStorage with a random key and return the key
  const key = 'puck_' + Math.random().toString(36).substring(2, 9);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
  return key;
}
