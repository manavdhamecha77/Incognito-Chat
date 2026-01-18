"use client"

import { treaty } from '@elysiajs/eden'
import type { App } from '../app/api/[[...slugs]]/route'

const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }
  return window.location.origin
}

export const client = treaty<App>(getBaseUrl()).api