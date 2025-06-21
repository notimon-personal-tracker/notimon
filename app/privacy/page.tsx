export default function PrivacyPolicyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-8 dark:bg-gray-900">
      <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white">
          Privacy Policy
        </h1>
        <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300">
          <p>
            The purpose of this tool is to help you track things in your life.
          </p>
          <p>
            We store your answers to any questions, as well as any other messages you send us as notes providing additional context to your answers.
          </p>
          <p>
            You can download all your data at any time by emailing us at <a href="mailto:hello@notimon.com">hello@notimon.com</a>.
          </p>
          <p>
            You can request your data to be deleted at any time. Your deletion request will be carried out as soon as possible, deleting it from the live database. It will be removed from backups once the next backup replaces all previous regular backups.
          </p>
          <p>
            Your data is only made available to yourself. We will not use it for any purpose.
          </p>
          <p>
            Technical administrators of this tool will have access to your data, but are only authorised to access it in ways directly related to providing this service.
          </p>
        </div>
      </div>
    </main>
  );
} 