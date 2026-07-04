import { redirect } from 'next/navigation';

export default function NewCabinetRedirectPage() {
  redirect('/dashboard/cabinets');
}
