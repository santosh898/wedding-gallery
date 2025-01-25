interface NameDialogProps {
  onSubmit: (name: string) => void;
}

export function NameDialog({ onSubmit }: NameDialogProps) {
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector("input");
    const name = input?.value.trim();
    if (name) {
      onSubmit(name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
        <p className="mb-4">Please enter your name to continue:</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            required
            minLength={2}
            maxLength={50}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
