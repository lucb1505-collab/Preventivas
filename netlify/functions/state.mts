import { and, eq } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { operationState } from '../../db/schema.js';
import { INITIAL_EQUIPMENT_DATA } from '../../db/seed.js';
const validEquipment = (items: unknown): items is Record<string, any>[] => Array.isArray(items) && items.length === 35 && new Set(items.map(e => e?.id)).size === 35 && items.every(e => INITIAL_EQUIPMENT_DATA.some(seed => seed.id === e?.id) && Number.isFinite(e.currentHours) && e.currentHours >= 0 && Number.isFinite(e.nextPreventive) && e.nextPreventive > 0 && Number.isFinite(e.lastPreventiveHours) && typeof e.lastPreventiveDate === 'string' && (e.preventiveHistory === undefined || Array.isArray(e.preventiveHistory)));
export default async (req: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const db = getDb();
    if (req.method === 'GET') {
      const equipmentList = INITIAL_EQUIPMENT_DATA.map(e => {
        const nextPreventive = (Math.floor(e.currentHours / 250) + 1) * 250;
        return {...e, nextPreventive, lastPreventiveHours: nextPreventive - 250, lastPreventiveDate: 'Carga Inicial', preventiveHistory: []};
      });
      await db.insert(operationState).values({id:'nemak', equipmentList, logs:[], revision:0}).onConflictDoNothing();
      const [state] = await db.select().from(operationState).where(eq(operationState.id, 'nemak'));
      return Response.json(state, {headers});
    }
    if (req.method === 'PUT') {
      if (req.headers.get('origin') && req.headers.get('origin') !== new URL(req.url).origin) return new Response(null,{status:403});
      const body = await req.json();
      if (!validEquipment(body.equipmentList) || !Array.isArray(body.logs) || body.logs.some((l: any) => !l || !['HOUR_UPDATE','PREVENTIVE_DONE'].includes(l.type) || !INITIAL_EQUIPMENT_DATA.some(e => e.id === l.equipmentId) || typeof l.date !== 'string') || !Number.isInteger(body.revision)) return Response.json({error:'Arquivo ou dados inválidos. Confira os 35 equipamentos e o histórico.'},{status:400, headers});
      const [saved] = await db.update(operationState).set({equipmentList:body.equipmentList,logs:body.logs,revision:body.revision+1}).where(and(eq(operationState.id,'nemak'),eq(operationState.revision,body.revision))).returning({revision:operationState.revision});
      if (!saved) return Response.json({error:'Os dados foram atualizados em outro acesso. A versão mais recente foi recarregada; repita sua alteração.'},{status:409,headers});
      return Response.json(saved, {headers});
    }
    return new Response(null,{status:405,headers:{Allow:'GET, PUT'}});
  } catch {
    return Response.json({error:'Não foi possível acessar o banco de dados. Tente novamente.'},{status:503,headers});
  }
};
export const config = { path: '/api/state' };
