import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root page to admin login
  redirect('/login');
}