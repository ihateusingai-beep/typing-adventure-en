export const LAN_TRANSPORT = 'lan-v1';
export const LAN_SIGNAL_LIMIT = 12000;
export const LAN_PAIR_LIFE = 125000;

export function localIceAddress(address) {
 if (typeof address !== 'string') return false;
 if (/^[\w-]+\.local\.?$/i.test(address)) return true;
 const v4 = address.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)?.slice(1).map(Number);
 if(v4) return v4.every(v=>v<=255) && (v4[0]===10 || v4[0]===127 ||
  v4[0]===192&&v4[1]===168 || v4[0]===172&&v4[1]>=16&&v4[1]<=31 ||
  v4[0]===169&&v4[1]===254);
 return /^[\da-f:]+$/i.test(address) && /^(?:f[cd][\da-f]{2}:|fe[89ab][\da-f]:|::1$)/i.test(address);
}

export function lanSdp(sdp) {
 if(typeof sdp!=='string'||sdp.length>LAN_SIGNAL_LIMIT||!sdp.startsWith('v=0')) return null;
 let candidates=0;
 const lines=sdp.trimEnd().split(/\r?\n/).filter(line=>{
  if(!line.startsWith('a=candidate:'))return true;
  const fields=line.split(/\s+/);
  const allowed=fields[6]==='typ'&&fields[7]==='host'&&localIceAddress(fields[4]);
  if(allowed)candidates++;
  return allowed;
 }).map(line=>{
  const conn=line.match(/^c=IN (IP[46]) (\S+)$/);
  return conn&&!localIceAddress(conn[2])?'c=IN '+conn[1]+(conn[1]==='IP4'?' 0.0.0.0':' ::'):line;
 });
 return candidates?lines.join('\r\n')+'\r\n':null;
}