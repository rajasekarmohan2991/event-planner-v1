export class ApiError extends Error {
  statusCode: number
  details?: any

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    return {
      error: {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      },
    }
  }
  
  if (error instanceof Error) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred',
        statusCode: 500,
      },
    }
  }

  return {
    error: {
      message: 'An unknown error occurred',
      statusCode: 500,
    },
  }
}

export function withErrorHandler(handler: Function) {
  return async function (...args: any[]) {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
