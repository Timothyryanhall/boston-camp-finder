import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { appRoutes, routerFuture } from './router';

describe('App routing', () => {
  it('renders the finder heading on the root route', () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/'],
      future: routerFuture,
    });

    render(<RouterProvider router={router} future={routerFuture} />);

    expect(
      screen.getByRole('heading', { name: /boston camp finder/i })
    ).toBeInTheDocument();
  });
});
