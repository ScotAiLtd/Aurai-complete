import Link from "next/link";
import { WindmillsBackground } from "@/components/windmills-background";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black overflow-hidden">
      <WindmillsBackground />
      <main className="relative z-10 flex flex-1 w-full items-center justify-center pb-64">
        <Button asChild size="lg" variant="secondary" className="px-8 text-base">
          <Link href="/auth">Login</Link>
        </Button>
      </main>
    </div>
  );
}
