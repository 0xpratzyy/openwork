import { useNavigate } from 'react-router-dom';

export default function Done() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Done</h1>
        <p className="text-gray-500 mb-6">This step is not implemented yet.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded mr-2"
        >
          Back
        </button>
        <button
          onClick={() => navigate(1)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
