import { NextResponse } from "next/server";

export type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
    requestId?: string;
  };
};

type ErrorResponseOptions = {
  details?: unknown;
  requestId?: string;
};

export function errorResponse(
  code: string,
  message: string,
  status: number,
  options: ErrorResponseOptions = {},
): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        status,
        ...(options.details === undefined ? {} : { details: options.details }),
        ...(options.requestId === undefined
          ? {}
          : { requestId: options.requestId }),
      },
    },
    { status },
  );
}
