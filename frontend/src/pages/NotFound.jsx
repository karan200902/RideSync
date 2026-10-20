import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-7xl font-bold">404</h1>

        <p className="mt-4 text-gray-400">
          The page you're looking for doesn't exist.
        </p>

        <Link
          to="/"
          className="inline-block mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
