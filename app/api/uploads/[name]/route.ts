import { NextResponse } from 'next/server';
import { readAttemptPhoto } from '@/lib/photos';
import { getSession } from '@/lib/session';
import { getAttempt } from '@/lib/store';

export const runtime = 'nodejs';

interface UploadRouteProps {
  params: Promise<{ name: string }>;
}

export async function GET(_request: Request, { params }: UploadRouteProps) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await params;
  const attemptId = name.split('.')[0];
  const attempt = await getAttempt(attemptId);
  if (!attempt?.photo_path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (session.role !== 'tutor' && attempt.student_id !== session.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const file = await readAttemptPhoto(name);
  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(Uint8Array.from(file.buffer), {
    headers: {
      'Content-Type': file.type,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
