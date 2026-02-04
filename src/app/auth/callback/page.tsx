"use client";

import * as React from "react";

const CALLBACK_SCHEME = "gobernaterritory02://";

export default function AuthCallbackPage() {
  React.useEffect(() => {
    window.location.href = CALLBACK_SCHEME;
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-900">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Redirigiendo...</h1>
        <p className="mt-3 text-sm text-slate-600">
          Si no se abre la app, toca {" "}
          <a className="font-semibold text-slate-900 underline" href={CALLBACK_SCHEME}>
            aqui
          </a>
          .
        </p>
      </div>
    </main>
  );
}
