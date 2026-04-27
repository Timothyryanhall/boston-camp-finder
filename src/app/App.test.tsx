import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { appRoutes } from './router';

describe('App routing', () => {
  it('renders the finder heading on the root route', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/'] });

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole('heading', { name: /boston camp finder/i })
    ).toBeInTheDocument();
  });

  it('shows the parent-run note in the site header', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/'] });

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByText(/run by boston-area parents/i),
    ).toBeInTheDocument();
  });
});
