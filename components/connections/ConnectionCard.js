// components/connections/ConnectionCard.js
import Link from "next/link";

const ConnectionCard = ({ connection }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            <svg
              className="h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
              />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {connection.name}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  {connection.db_type === "mysql"
                    ? "MySQL"
                    : connection.db_type === "postgresql"
                    ? "PostgreSQL"
                    : connection.db_type === "sqlserver"
                    ? "SQL Server"
                    : connection.db_type === "mongodb"
                    ? "MongoDB"
                    : connection.db_type}
                </div>
              </dd>
            </dl>
          </div>
        </div>

        <div className="mt-4">
          <dl className="grid grid-cols-1 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Host</dt>
                <dd
                  className="text-sm text-gray-900 text-right"
                  title={`${connection.host}:${connection.port}`}
                >
                  <div className="max-w-[180px] truncate">
                    {connection.host}:{connection.port}
                  </div>
                </dd>
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Database</dt>
                <dd
                  className="text-sm text-gray-900 text-right"
                  title={connection.database}
                >
                  <div className="max-w-[180px] truncate">
                    {connection.database}
                  </div>
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="flex justify-between space-x-2">
          <Link
            href={`/connections/${connection.id}`}
            className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-gray-100 rounded-md transition-colors"
          >
            View details
          </Link>
          <Link
            href={`/connections/${connection.id}/query`}
            className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-gray-100 rounded-md transition-colors"
          >
            Query
          </Link>
          <Link
            href={`/connections/${connection.id}/dashboard`}
            className="flex-1 text-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 hover:bg-gray-100 rounded-md transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConnectionCard;
