import { redirect } from 'next/navigation';

// Root route — redirect ke /songs (atau /login kalau belum auth, dihandle di sana)
export default function RootPage() {
    redirect('/songs');
}
