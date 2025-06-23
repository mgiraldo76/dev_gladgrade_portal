import { FirebaseDebug } from "@/components/firebase-debug"

export default function DebugPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Firebase Configuration Debug</h1>
      <FirebaseDebug />

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Troubleshooting Steps:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Make sure your <code>.env.local</code> file is in the root directory
          </li>
          <li>Restart the development server after changing environment variables</li>
          <li>
            Check that all environment variables start with <code>NEXT_PUBLIC_</code>
          </li>
          <li>Verify your Firebase project settings in the Firebase Console</li>
          <li>Make sure Authentication is enabled in your Firebase project</li>
        </ol>
      </div>
    </div>
  )
}
