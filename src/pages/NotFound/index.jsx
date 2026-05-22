import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center bg-red">
      {/* <ForbiddenIcon className="w-12 h-12 mt-8 text-purple-200" aria-hidden="true" /> */}
      <h1 className="text-6xl font-semibold text-gray-700 dark:text-gray-200">
        404
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        Page not found. Check the address or{" "}
        <span
          className="text-purple-600 hover:underline dark:text-purple-300 cursor-pointer"
          onClick={() => handleBack()}
        >
          go back
        </span>
        .
      </p>
    </div>
  );
}

export default NotFound;
