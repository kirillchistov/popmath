import { NextResponse } from 'next/server';
import { listCohortRows } from '@/lib/cohort';
import { getSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'tutor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const cohort = await listCohortRows();
  return NextResponse.json({ cohort });
}
