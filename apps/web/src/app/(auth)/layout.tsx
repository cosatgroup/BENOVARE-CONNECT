import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutre-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/logo/connect-horizontal-couleur.svg" alt="Benovare Connect" width={200} height={40} />
        </div>
        <div className="rounded-xl border border-neutre-200 bg-surface p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
