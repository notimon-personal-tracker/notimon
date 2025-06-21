import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">
      <div className="max-w-md text-center">
        <h1 className="my-8 text-5xl font-bold text-gray-900 dark:text-white">
          notimon
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Notimon lets you quantify your life. Every day it sends you questions to help you monitor what you want to track. Download and analyze your data any time.
        </p>
        <div className="mt-8 flex justify-center">
          <Image
            src="/wireframe.png"
            alt="Notimon Wireframe"
            width={400}
            height={300}
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
      <footer className="mt-8 text-gray-600 dark:text-gray-400">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </main>
  );
}
