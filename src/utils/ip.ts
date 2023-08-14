/** Convert a Deno connection to a readable IP address. */
export const connToString = (conn: Deno.Conn): string => (conn.remoteAddr as Deno.NetAddr).hostname;